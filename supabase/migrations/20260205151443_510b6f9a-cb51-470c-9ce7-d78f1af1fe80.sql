-- Create table to track news reward claims
CREATE TABLE public.news_rewards_claimed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.news_articles(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_type TEXT NOT NULL,
  reward_amount INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Enable RLS
ALTER TABLE public.news_rewards_claimed ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view their own reward claims"
ON public.news_rewards_claimed
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own claims (via RPC)
CREATE POLICY "Users can claim rewards"
ON public.news_rewards_claimed
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create RPC function to claim news reward
CREATE OR REPLACE FUNCTION public.claim_news_reward(
  p_user_id UUID,
  p_article_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_article RECORD;
  v_already_claimed BOOLEAN;
  v_reward_spins INTEGER := 15;
BEGIN
  -- Check if article exists and has reward
  SELECT * INTO v_article
  FROM news_articles
  WHERE id = p_article_id
    AND is_active = true
    AND published_at <= now()
    AND (published_at + INTERVAL '14 days') >= now();
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Recompensa não disponível ou expirada'
    );
  END IF;
  
  -- Check if already claimed
  SELECT EXISTS(
    SELECT 1 FROM news_rewards_claimed
    WHERE user_id = p_user_id AND article_id = p_article_id
  ) INTO v_already_claimed;
  
  IF v_already_claimed THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Você já resgatou esta recompensa'
    );
  END IF;
  
  -- Add spins to user
  UPDATE user_spins
  SET free_spins = free_spins + v_reward_spins,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Record the claim
  INSERT INTO news_rewards_claimed (user_id, article_id, reward_type, reward_amount)
  VALUES (p_user_id, p_article_id, 'spins', v_reward_spins);
  
  RETURN json_build_object(
    'success', true,
    'message', 'Recompensa resgatada com sucesso!',
    'reward_type', 'spins',
    'reward_amount', v_reward_spins
  );
END;
$$;

-- Insert the apology news article
INSERT INTO public.news_articles (
  title,
  title_en,
  content,
  content_en,
  category,
  is_pinned,
  is_active,
  published_at
) VALUES (
  '🎁 Bônus de Compensação: 15 Giros Grátis!',
  '🎁 Compensation Bonus: 15 Free Spins!',
  'Olá, treinadores!

Vocês devem ter notado que adicionamos alguns anúncios no site recentemente. Gostaria de ser transparente com vocês sobre isso.

**Por que anúncios?**

Sou um desenvolvedor solo trabalhando no PokéRoulette, e manter os servidores funcionando 24/7 tem um custo mensal que acaba pesando no bolso. Os anúncios ajudam a cobrir essas despesas e permitem que o jogo continue gratuito para todos.

**Meu pedido de desculpas**

Sei que anúncios podem ser inconvenientes, então preparei um presente especial como forma de agradecimento pela compreensão de vocês:

**🎰 15 Giros Grátis na Roleta!**

Cada conta pode resgatar uma vez. Esta oferta é válida por 14 dias.

Clique no botão abaixo para resgatar seus giros!

Obrigado por fazerem parte desta comunidade. Vocês são incríveis! 💜',
  'Hello, trainers!

You may have noticed that we recently added some ads to the site. I want to be transparent with you about this.

**Why ads?**

I''m a solo developer working on PokéRoulette, and keeping the servers running 24/7 has a monthly cost that adds up. The ads help cover these expenses and allow the game to remain free for everyone.

**My apology**

I know ads can be inconvenient, so I''ve prepared a special gift as a thank you for your understanding:

**🎰 15 Free Spins on the Roulette!**

Each account can claim once. This offer is valid for 14 days.

Click the button below to claim your spins!

Thank you for being part of this community. You are amazing! 💜',
  'announcement',
  true,
  true,
  now()
);