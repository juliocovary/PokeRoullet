-- Criar tabela de artigos/notícias
CREATE TABLE public.news_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'announcement',
  image_url TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('update', 'event', 'tip', 'announcement'))
);

-- Criar tabela de status de leitura
CREATE TABLE public.news_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Habilitar RLS
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_read_status ENABLE ROW LEVEL SECURITY;

-- Políticas para news_articles (todos podem ver notícias ativas)
CREATE POLICY "Anyone can view active news"
ON public.news_articles
FOR SELECT
USING (is_active = true);

-- Políticas para news_read_status
CREATE POLICY "Users can view their own read status"
ON public.news_read_status
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can mark news as read"
ON public.news_read_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX idx_news_articles_active ON public.news_articles(is_active, is_pinned DESC, published_at DESC);
CREATE INDEX idx_news_read_status_user ON public.news_read_status(user_id, article_id);

-- Inserir algumas notícias de exemplo
INSERT INTO public.news_articles (title, content, category, is_pinned, published_at) VALUES
('Bem-vindo ao PokéRoulette!', 
'O PokéRoulette é um jogo de coleção de Pokémon onde você pode girar a roleta para ganhar novos Pokémon, completar sua Pokédex e competir com outros treinadores!

**Como jogar:**
- Use seus giros gratuitos para ganhar Pokémon
- Cole os Pokémon na sua Pokédex para completar a coleção
- Complete missões diárias e semanais para ganhar recompensas
- Evolua seus Pokémon usando Evolution Stones
- Participe do evento de lançamento para ganhar recompensas exclusivas!

Boa sorte, treinador!', 
'announcement', true, now()),

('Sistema de Notícias Lançado!', 
'Agora você pode acompanhar todas as novidades do jogo aqui no PokéNews! 

Fique de olho para não perder:
- Anúncios de novos eventos
- Atualizações e balanceamentos
- Dicas para melhorar sua jogabilidade
- E muito mais!', 
'update', false, now() - interval '1 hour');