-- Adicionar política para permitir que usuários vejam perfis de outros usuários para busca
CREATE POLICY "Users can view other profiles for search" 
ON public.profiles 
FOR SELECT 
USING (true);