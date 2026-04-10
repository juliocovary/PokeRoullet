import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const useLuckProgression = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const increaseLuck = async (amount: number) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado',
        variant: 'destructive',
      });
      return false;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('increase_luck_multiplier', {
        p_user_id: user.id,
        p_amount: amount
      } as any);

      if (error) {
        console.error('Error increasing luck:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao aumentar sorte',
          variant: 'destructive',
        });
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error increasing luck:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { increaseLuck, isLoading };
};
