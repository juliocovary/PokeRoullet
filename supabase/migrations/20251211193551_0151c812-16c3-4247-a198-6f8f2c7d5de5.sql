-- Add RLS policy for DELETE on user_items table
CREATE POLICY "Users can delete their own items" 
ON public.user_items 
FOR DELETE 
USING (auth.uid() = user_id);