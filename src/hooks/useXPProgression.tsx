import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

export const useXPProgression = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const increaseXPMultiplier = async (percentage: number) => {
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
      const { data, error } = await supabase.rpc('increase_xp_multiplier', {
        p_user_id: user.id,
        p_percentage: percentage
      });

      if (error) {
        console.error('Error increasing XP multiplier:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao aumentar multiplicador de XP',
          variant: 'destructive',
        });
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error increasing XP multiplier:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return { increaseXPMultiplier, isLoading };
};
