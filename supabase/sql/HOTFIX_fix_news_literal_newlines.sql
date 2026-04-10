-- Fix existing news records that were saved with literal "\n" sequences.
-- Run in Supabase SQL Editor.

UPDATE public.news_articles
SET content = replace(content, '\n', chr(10)),
    content_en = replace(content_en, '\n', chr(10))
WHERE title = 'Comunicado Oficial: Correcoes de Bugs + Codigo de Compensacao';
