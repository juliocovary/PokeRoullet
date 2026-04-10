-- Add English translation columns to news_articles
ALTER TABLE public.news_articles 
ADD COLUMN title_en text,
ADD COLUMN content_en text;

-- Copy existing content as Portuguese (rename current to _pt equivalent logic)
-- The existing title/content will be treated as Portuguese
-- English versions will be NULL until filled

COMMENT ON COLUMN public.news_articles.title IS 'Portuguese title (default)';
COMMENT ON COLUMN public.news_articles.content IS 'Portuguese content (default)';
COMMENT ON COLUMN public.news_articles.title_en IS 'English title';
COMMENT ON COLUMN public.news_articles.content_en IS 'English content';