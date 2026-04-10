import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useLanguage } from './useLanguage';

export interface NewsArticleRaw {
  id: string;
  title: string;
  content: string;
  title_en: string | null;
  content_en: string | null;
  category: 'update' | 'event' | 'tip' | 'announcement';
  image_url: string | null;
  is_pinned: boolean;
  published_at: string;
  created_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  category: 'update' | 'event' | 'tip' | 'announcement';
  image_url: string | null;
  is_pinned: boolean;
  published_at: string;
  created_at: string;
  likes_count: number;
  user_has_liked: boolean;
  has_reward: boolean;
  reward_claimed: boolean;
  reward_expires_at: string | null;
}

export interface NewsReadStatus {
  article_id: string;
  read_at: string;
}

export function useNews() {
  const NEWS_CACHE_TTL_MS = 5 * 60 * 1000;
  const { user } = useAuth();
  const { currentLanguage } = useLanguage();
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [readStatus, setReadStatus] = useState<NewsReadStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<number | null>(null);

  // Lightweight function to fetch only unread count (for Header badge)
  const fetchUnreadCount = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('get_unread_news_count', {
        p_user_id: user.id
      });
      
      if (!error && data !== null) {
        setUnreadCount(data);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  const fetchNews = useCallback(async (options?: { force?: boolean }) => {
    const shouldUseCache = !options?.force && hasLoaded && lastLoadedAt !== null && (Date.now() - lastLoadedAt) < NEWS_CACHE_TTL_MS;
    if (shouldUseCache) return;

    setLoading(true);
    try {
      // Fetch articles
      const { data: articlesData, error: articlesError } = await supabase
        .from('news_articles')
        .select('id, title, content, title_en, content_en, category, image_url, is_pinned, published_at, created_at')
        .eq('is_active', true)
        .order('is_pinned', { ascending: false })
        .order('published_at', { ascending: false })
        .limit(50);

      if (articlesError) throw articlesError;
      
      const rawData = articlesData as NewsArticleRaw[] || [];
      const articleIds = rawData.map(article => article.id);

      if (articleIds.length === 0) {
        setNews([]);
        setReadStatus([]);
        setUnreadCount(0);
        setHasLoaded(true);
        setLastLoadedAt(Date.now());
        return;
      }
      
      // Fetch likes count only for visible articles
      const { data: likesData, error: likesError } = await supabase
        .from('news_article_likes')
        .select('article_id')
        .in('article_id', articleIds);

      if (likesError) throw likesError;

      // Count likes per article
      const likesCountMap = new Map<string, number>();
      (likesData || []).forEach(like => {
        const current = likesCountMap.get(like.article_id) || 0;
        likesCountMap.set(like.article_id, current + 1);
      });

      // Check which articles the current user has liked and claimed rewards
      const userLikedSet = new Set<string>();
      const userClaimedSet = new Set<string>();
      if (user) {
        const [likesResult, claimsResult] = await Promise.all([
          supabase
            .from('news_article_likes')
            .select('article_id')
            .in('article_id', articleIds)
            .eq('user_id', user.id),
          supabase
            .from('news_rewards_claimed')
            .select('article_id')
            .in('article_id', articleIds)
            .eq('user_id', user.id)
        ]);

        if (!likesResult.error && likesResult.data) {
          likesResult.data.forEach(like => userLikedSet.add(like.article_id));
        }
        if (!claimsResult.error && claimsResult.data) {
          claimsResult.data.forEach(claim => userClaimedSet.add(claim.article_id));
        }
      }

      // Map data to use correct language fields and include likes
      // Check if article has claimable reward (published within 14 days and is the compensation article)
      const localizedNews: NewsArticle[] = rawData.map(article => {
        const publishedDate = new Date(article.published_at);
        const expiresAt = new Date(publishedDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        const isCompensationArticle = article.title.includes('Bônus de Compensação') || 
                                       (article.title_en && article.title_en.includes('Compensation Bonus'));
        const hasReward = isCompensationArticle && new Date() < expiresAt;

        // Some DB inserts may contain literal "\\n" sequences.
        // Normalize them so the News modal renders line breaks consistently.
        const contentPt = article.content.replace(/\\n/g, '\n');
        const contentEn = (article.content_en || '').replace(/\\n/g, '\n');
        
        return {
          id: article.id,
          title: currentLanguage === 'en' && article.title_en ? article.title_en : article.title,
          content: currentLanguage === 'en' && article.content_en ? contentEn : contentPt,
          category: article.category,
          image_url: article.image_url,
          is_pinned: article.is_pinned,
          published_at: article.published_at,
          created_at: article.created_at,
          likes_count: likesCountMap.get(article.id) || 0,
          user_has_liked: userLikedSet.has(article.id),
          has_reward: hasReward,
          reward_claimed: userClaimedSet.has(article.id),
          reward_expires_at: hasReward ? expiresAt.toISOString() : null
        };
      });
      
      setNews(localizedNews);
      setHasLoaded(true);
      setLastLoadedAt(Date.now());
      
      // Also fetch read status when loading full news
      if (user) {
        const { data: readData, error: readError } = await supabase
          .from('news_read_status')
          .select('article_id, read_at')
          .in('article_id', articleIds)
          .eq('user_id', user.id);

        if (!readError) {
          setReadStatus((readData as NewsReadStatus[]) || []);
          // Calculate unread count from fresh data
          const readArticleIds = new Set(readData?.map(r => r.article_id) || []);
          const unread = localizedNews.filter(article => !readArticleIds.has(article.id));
          setUnreadCount(unread.length);
        }
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setLoading(false);
    }
  }, [currentLanguage, user, hasLoaded, lastLoadedAt]);

  // Calculate unread count from local state (when readStatus changes)
  useEffect(() => {
    if (!user || !hasLoaded) {
      return;
    }
    
    const readArticleIds = new Set(readStatus.map(r => r.article_id));
    const unread = news.filter(article => !readArticleIds.has(article.id));
    setUnreadCount(unread.length);
  }, [news, readStatus, user, hasLoaded]);

  const markAsRead = useCallback(async (articleId: string) => {
    if (!user) return;
    
    // Check if already read
    if (readStatus.some(r => r.article_id === articleId)) return;

    try {
      const { error } = await supabase
        .from('news_read_status')
        .insert({
          user_id: user.id,
          article_id: articleId
        });

      if (error) throw error;
      
      // Update local state
      setReadStatus(prev => [...prev, { article_id: articleId, read_at: new Date().toISOString() }]);
    } catch (error) {
      console.error('Error marking news as read:', error);
    }
  }, [user, readStatus]);

  const isRead = useCallback((articleId: string): boolean => {
    return readStatus.some(r => r.article_id === articleId);
  }, [readStatus]);

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    const unreadArticles = news.filter(article => !isRead(article.id));
    if (unreadArticles.length === 0) return;

    try {
      const inserts = unreadArticles.map(article => ({
        user_id: user.id,
        article_id: article.id
      }));

      const { error } = await supabase
        .from('news_read_status')
        .insert(inserts);

      if (error) throw error;
      
      // Update local state
      const newReadStatuses = unreadArticles.map(article => ({
        article_id: article.id,
        read_at: new Date().toISOString()
      }));
      setReadStatus(prev => [...prev, ...newReadStatuses]);
    } catch (error) {
      console.error('Error marking all news as read:', error);
    }
  }, [user, news, isRead]);

  const toggleLike = useCallback(async (articleId: string) => {
    if (!user) return;

    const article = news.find(a => a.id === articleId);
    if (!article) return;

    try {
      if (article.user_has_liked) {
        // Remove like
        const { error } = await supabase
          .from('news_article_likes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', user.id);

        if (error) throw error;

        // Update local state
        setNews(prev => prev.map(a => 
          a.id === articleId 
            ? { ...a, likes_count: a.likes_count - 1, user_has_liked: false }
            : a
        ));
      } else {
        // Add like
        const { error } = await supabase
          .from('news_article_likes')
          .insert({
            article_id: articleId,
            user_id: user.id
          });

        if (error) throw error;

        // Update local state
        setNews(prev => prev.map(a => 
          a.id === articleId 
            ? { ...a, likes_count: a.likes_count + 1, user_has_liked: true }
            : a
        ));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  }, [user, news]);

  const claimReward = useCallback(async (articleId: string): Promise<{ success: boolean; message: string; reward_amount?: number }> => {
    if (!user) {
      return { success: false, message: 'Você precisa estar logado para resgatar a recompensa' };
    }

    try {
      const { data, error } = await supabase.rpc('claim_news_reward', {
        p_user_id: user.id,
        p_article_id: articleId
      });

      if (error) throw error;

      const result = data as { success: boolean; message: string; reward_amount?: number };

      if (result.success) {
        // Update local state to mark as claimed
        setNews(prev => prev.map(a => 
          a.id === articleId 
            ? { ...a, reward_claimed: true }
            : a
        ));
      }

      return result;
    } catch (error) {
      console.error('Error claiming reward:', error);
      return { success: false, message: 'Erro ao resgatar recompensa' };
    }
  }, [user]);

  return {
    news,
    loading,
    unreadCount,
    hasLoaded,
    markAsRead,
    markAllAsRead,
    isRead,
    toggleLike,
    claimReward,
    loadNews: fetchNews,
    fetchUnreadCount,
    refetch: () => fetchNews({ force: true })
  };
}
