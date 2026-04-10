import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSpinTimer = (freeSpins?: number, baseSpins?: number, onReset?: () => void) => {
  const [timeUntilNextReset, setTimeUntilNextReset] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const callSpinReset = useCallback(async () => {
    try {
      console.log('🔄 Verificando reset de spins automaticamente...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('❌ Usuário não autenticado');
        return;
      }
      
      const { data, error } = await supabase.rpc('check_and_reset_free_spins', {
        p_user_id: user.id
      });
      
      console.log('📊 Resultado do reset:', { data, error });
      
      if (error) {
        console.error('❌ Erro ao verificar reset de spins:', error);
      } else if (data && data.length > 0 && data[0].free_spins > 0) {
        console.log('✅ Spins resetados! Chamando onReset callback...');
        onReset?.();
      } else {
        console.log('ℹ️ Spins ainda não prontos. last_spin_reset:', data?.[0]?.last_spin_reset);
      }
    } catch (error) {
      console.error('❌ Erro ao chamar reset de spins:', error);
    }
  }, [onReset]);

  useEffect(() => {
    // Timer só ativa quando não há giros gratuitos
    if (freeSpins === undefined || freeSpins > 0) {
      setIsTimerActive(false);
      setTimeUntilNextReset(0);
      return;
    }

    // Chamar reset imediatamente ao montar se freeSpins = 0
    callSpinReset();

    const updateTimer = () => {
      const now = new Date();
      const currentUTCHour = now.getUTCHours();
      
      // Calcular próximo horário de reset em UTC (sempre horários ímpares: 01:00, 03:00, 05:00, etc. UTC)
      let nextResetHour = currentUTCHour;
      if (currentUTCHour % 2 === 1) {
        // Se estivermos em um horário ímpar UTC, próximo reset é em 2 horas
        nextResetHour = currentUTCHour + 2;
      } else {
        // Se estivermos em um horário par UTC, próximo reset é na próxima hora ímpar
        nextResetHour = currentUTCHour + 1;
      }
      
      // Se passarmos de 24h, ajustar para o próximo dia
      if (nextResetHour >= 24) {
        nextResetHour = nextResetHour - 24;
      }

      // Criar data do próximo reset em UTC
      const nextReset = new Date(now);
      nextReset.setUTCHours(nextResetHour, 0, 0, 0);
      nextReset.setUTCMinutes(0);
      nextReset.setUTCSeconds(0);
      nextReset.setUTCMilliseconds(0);
      
      // Se o próximo reset for antes do horário atual, significa que é no próximo dia
      if (nextReset <= now) {
        nextReset.setUTCDate(nextReset.getUTCDate() + 1);
      }

      const timeLeft = nextReset.getTime() - now.getTime();

      if (timeLeft > 0) {
        setTimeUntilNextReset(timeLeft);
        setIsTimerActive(true);
      } else {
        // Timer zerou, chamar reset
        callSpinReset();
        setTimeUntilNextReset(0);
      }
    };

    updateTimer();
    // OPTIMIZATION: Update display every second but only call RPC every 60s
    const interval = setInterval(updateTimer, 1000);
    const resetCheckInterval = setInterval(callSpinReset, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(resetCheckInterval);
    };
  }, [freeSpins, callSpinReset]);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    timeUntilNextReset,
    isTimerActive,
    formattedTime: formatTime(timeUntilNextReset),
    baseSpins: baseSpins || 0
  };
};