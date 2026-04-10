-- Create table for news article likes
CREATE TABLE public.news_article_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(article_id, user_id)
);

-- Enable RLS
ALTER TABLE public.news_article_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes (to show count)
CREATE POLICY "Anyone can view likes count"
ON public.news_article_likes
FOR SELECT
USING (true);

-- Users can insert their own likes
CREATE POLICY "Users can like articles"
ON public.news_article_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own likes
CREATE POLICY "Users can unlike articles"
ON public.news_article_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Add index for faster queries
CREATE INDEX idx_news_article_likes_article_id ON public.news_article_likes(article_id);
CREATE INDEX idx_news_article_likes_user_id ON public.news_article_likes(user_id);