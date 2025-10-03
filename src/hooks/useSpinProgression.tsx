import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useSpinProgression = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const increaseBaseSpins = async (amount: number) => {
    if (!user) return false;
    
    setIsLoading(true);
    try {
      // First check if user exists in user_spins table
      const { data: userSpins, error: checkError } = await supabase
        .from('user_spins')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      
      if (checkError) {
        // If user doesn't exist, create the record first
        if (checkError.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('user_spins')
            .insert({
              user_id: user.id,
              free_spins: 5,
              base_free_spins: 5
            });
          
          if (insertError) {
            console.error('Error creating user_spins:', insertError);
            return false;
          }
        } else {
          return false;
        }
      }
      
      const { data, error } = await supabase.rpc('increase_base_spins', {
        p_user_id: user.id,
        p_amount: amount
      });

      if (error) {
        console.error('Error calling increase_base_spins RPC:', error);
        return false;
      }

      return data;
    } catch (error) {
      console.error('Error in increaseBaseSpins:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    increaseBaseSpins,
    isLoading
  };
};