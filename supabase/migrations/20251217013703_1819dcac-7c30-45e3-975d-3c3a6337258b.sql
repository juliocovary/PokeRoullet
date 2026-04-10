-- Add DELETE policy to friendships table so users can remove friends
CREATE POLICY "Users can delete their own friendships"
ON public.friendships
FOR DELETE
USING ((auth.uid() = requester_id) OR (auth.uid() = addressee_id));