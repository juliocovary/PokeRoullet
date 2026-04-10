import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Newspaper, Pin, ChevronLeft, Sparkles, Calendar, Lightbulb, Megaphone, CheckCheck, X, Heart, Gift, Check, Loader2 } from 'lucide-react';
import { useNews, NewsArticle } from '@/hooks/useNews';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

interface NewsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryConfig = {
  update: { icon: Sparkles, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  event: { icon: Calendar, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  tip: { icon: Lightbulb, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  announcement: { icon: Megaphone, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
};

export function NewsModal({ isOpen, onClose }: NewsModalProps) {
  const { t } = useTranslation('modals');
  const { currentLanguage } = useLanguage();
  const { user } = useAuth();
  const { news, loading, unreadCount, markAsRead, markAllAsRead, isRead, toggleLike, claimReward, loadNews } = useNews();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [claimingReward, setClaimingReward] = useState(false);

  // Load on open; hook-level cache prevents repeated heavy fetches on quick re-opens.
  useEffect(() => {
    if (isOpen) {
      loadNews({ force: !news.length });
    }
  }, [isOpen, loadNews, news.length]);

  // Reset selected article when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedArticle(null);
    }
  }, [isOpen]);

  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    markAsRead(article.id);
  };

  const handleLikeClick = (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation();
    if (user) {
      toggleLike(articleId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = currentLanguage === 'pt' ? ptBR : enUS;
    return format(date, 'dd MMM yyyy', { locale });
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const locale = currentLanguage === 'pt' ? ptBR : enUS;
    return formatDistanceToNow(new Date(expiresAt), { addSuffix: false, locale });
  };

  const handleClaimReward = async (articleId: string) => {
    if (!user || claimingReward) return;
    
    setClaimingReward(true);
    const result = await claimReward(articleId);
    setClaimingReward(false);

    if (result.success) {
      toast.success(t('news.rewardClaimed', { amount: result.reward_amount }));
      // Update selected article if viewing it
      if (selectedArticle?.id === articleId) {
        setSelectedArticle(prev => prev ? { ...prev, reward_claimed: true } : null);
      }
    } else {
      toast.error(result.message);
    }
  };

  const getCategoryLabel = (category: string) => {
    return t(`news.categories.${category}`, category.toUpperCase());
  };

  const renderLikeButton = (article: NewsArticle, size: 'sm' | 'md' = 'sm') => {
    const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
    
    return (
      <button
        onClick={(e) => handleLikeClick(e, article.id)}
        disabled={!user}
        className={`shrink-0 whitespace-nowrap flex items-center gap-1 ${textSize} transition-colors ${
          article.user_has_liked
            ? 'text-red-500'
            : 'text-muted-foreground hover:text-red-500'
        } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={!user ? t('news.loginToLike') : article.user_has_liked ? t('news.liked') : t('news.like')}
      >
        <Heart 
          className={`${iconSize} transition-all ${article.user_has_liked ? 'fill-red-500' : ''}`} 
        />
        <span>{article.likes_count}</span>
      </button>
    );
  };

  const renderRewardButton = (article: NewsArticle, size: 'sm' | 'lg' = 'sm') => {
    if (!article.has_reward) return null;

    if (article.reward_claimed) {
      return (
        <div className={`flex items-center gap-1.5 ${size === 'lg' ? 'text-sm' : 'text-xs'} text-green-500`}>
          <Check className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>{t('news.rewardAlreadyClaimed')}</span>
        </div>
      );
    }

    if (!user) {
      return (
        <div className={`${size === 'lg' ? 'text-sm' : 'text-xs'} text-muted-foreground`}>
          {t('news.loginToClaim')}
        </div>
      );
    }

    return (
      <Button
        size={size === 'lg' ? 'default' : 'sm'}
        onClick={(e) => {
          e.stopPropagation();
          handleClaimReward(article.id);
        }}
        disabled={claimingReward}
        className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black font-bold animate-pulse"
      >
        {claimingReward ? (
          <Loader2 className="w-4 h-4 animate-spin mr-1" />
        ) : (
          <Gift className="w-4 h-4 mr-1" />
        )}
        {t('news.claimReward')}
      </Button>
    );
  };

  const renderArticleList = () => (
    <ScrollArea className="h-[50vh] sm:h-[60vh] pr-2 sm:pr-3">
      <div className="space-y-3 pb-1">
        {news.map((article) => {
          const config = categoryConfig[article.category] || categoryConfig.announcement;
          const CategoryIcon = config.icon;
          const articleIsRead = isRead(article.id);
          
          return (
            <button
              key={article.id}
              onClick={() => handleArticleClick(article)}
              className={`w-full text-left p-4 rounded-xl border transition-colors ${
                articleIsRead 
                  ? 'bg-card/50 border-border/50' 
                  : 'bg-card border-primary/30 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                {article.is_pinned && (
                  <Pin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-1" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <Badge variant="outline" className={`${config.color} text-xs flex items-center gap-1`}>
                      <CategoryIcon className="w-3 h-3" />
                      {getCategoryLabel(article.category)}
                    </Badge>
                    {!articleIsRead && (
                      <Badge className="bg-red-500 text-white text-xs animate-pulse">
                        {t('news.new')}
                      </Badge>
                    )}
                  </div>
                  <h4 className={`font-semibold text-sm mb-1 line-clamp-2 leading-snug break-words [overflow-wrap:anywhere] ${articleIsRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {article.title}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 break-words [overflow-wrap:anywhere]">
                    {article.content.replace(/\s+/g, ' ').trim()}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="text-xs text-muted-foreground/70 min-w-0 mr-auto truncate">
                      {formatDate(article.published_at)}
                    </p>
                    <div className="flex items-center gap-2 max-w-full shrink-0">
                      {article.has_reward && !article.reward_claimed && (
                        <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs animate-pulse max-w-[120px] sm:max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap">
                          <Gift className="w-3 h-3 mr-1" />
                          {t('news.hasReward')}
                        </Badge>
                      )}
                      {renderLikeButton(article)}
                    </div>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
        
        {news.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Newspaper className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('news.noNews')}</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  const renderArticleDetail = () => {
    if (!selectedArticle) return null;
    
    const config = categoryConfig[selectedArticle.category] || categoryConfig.announcement;
    const CategoryIcon = config.icon;
    
    return (
      <div className="space-y-4">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setSelectedArticle(null)}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" />
          {t('news.backToList')}
        </Button>
        
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {selectedArticle.is_pinned && (
              <Pin className="w-4 h-4 text-amber-400" />
            )}
            <Badge variant="outline" className={`${config.color} text-xs flex items-center gap-1`}>
              <CategoryIcon className="w-3 h-3" />
              {getCategoryLabel(selectedArticle.category)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(selectedArticle.published_at)}
            </span>
            {selectedArticle.has_reward && selectedArticle.reward_expires_at && !selectedArticle.reward_claimed && (
              <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                ⏰ {t('news.expiresIn', { time: formatTimeRemaining(selectedArticle.reward_expires_at) })}
              </Badge>
            )}
          </div>
          {renderLikeButton(selectedArticle, 'md')}
        </div>
        
        <h3 className="text-xl font-bold break-words [overflow-wrap:anywhere]">{selectedArticle.title}</h3>
        
        {selectedArticle.image_url && (
          <img 
            src={selectedArticle.image_url} 
            alt={selectedArticle.title}
            className="w-full rounded-lg object-cover max-h-48"
          />
        )}
        
        <ScrollArea className="h-[30vh] sm:h-[40vh]">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {selectedArticle.content.split('\n').map((paragraph, index) => {
              // Handle markdown-style bold
              const formattedText = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              // Handle markdown-style lists
              if (paragraph.startsWith('- ')) {
                return (
                  <li 
                    key={index} 
                    className="text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: formattedText.substring(2) }}
                  />
                );
              }
              if (paragraph.trim() === '') return <br key={index} />;
              return (
                <p 
                  key={index} 
                  className="text-muted-foreground mb-2"
                  dangerouslySetInnerHTML={{ __html: formattedText }}
                />
              );
              })}
            </div>
          </ScrollArea>

          {/* Reward claim section */}
          {selectedArticle.has_reward && (
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/30">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-amber-400" />
                  <span className="font-semibold text-amber-400">{t('news.giftAvailable')}</span>
                </div>
                {renderRewardButton(selectedArticle, 'lg')}
              </div>
            </div>
          )}
        </div>
      );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden [&>button]:hidden flex flex-col">
        <DialogHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Newspaper className="w-6 h-6 text-primary" />
              {t('news.title')}
              {unreadCount > 0 && !selectedArticle && (
                <Badge className="bg-red-500 text-white text-xs ml-2">
                  {unreadCount} {t('news.new')}
                </Badge>
              )}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2">
            {!selectedArticle && unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                {t('news.markAllRead')}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <p className="text-sm text-muted-foreground -mt-2 mb-2">
          {t('news.subtitle')}
        </p>
        
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : selectedArticle ? (
          renderArticleDetail()
        ) : (
          renderArticleList()
        )}
      </DialogContent>
    </Dialog>
  );
}
