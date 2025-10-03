import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useSpinTimer = (freeSpins?: number, baseSpins?: number) => {
  const [timeUntilNextReset, setTimeUntilNextReset] = useState<number>(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [lastResetCheck, setLastResetCheck] = useState<number>(0);

  useEffect(() => {
    // Timer só ativa quando não há giros gratuitos
    if (freeSpins === undefined || freeSpins > 0) {
      setIsTimerActive(false);
      setTimeUntilNextReset(0);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentSeconds = now.getSeconds();
      
      // Calcular próximo horário de reset (sempre horários ímpares: 01:00, 03:00, 05:00, etc.)
      let nextResetHour = currentHour;
      if (currentHour % 2 === 1) {
        // Se estivermos em um horário ímpar, próximo reset é em 2 horas
        nextResetHour = currentHour + 2;
      } else {
        // Se estivermos em um horário par, próximo reset é na próxima hora ímpar
        nextResetHour = currentHour + 1;
      }
      
      // Se passarmos de 24h, ajustar para o próximo dia
      if (nextResetHour >= 24) {
        nextResetHour = nextResetHour - 24;
      }

      // Criar data do próximo reset
      const nextReset = new Date(now);
      nextReset.setHours(nextResetHour, 0, 0, 0);
      
      // Se o próximo reset for antes do horário atual, significa que é no próximo dia
      if (nextReset <= now) {
        nextReset.setDate(nextReset.getDate() + 1);
      }

      const timeLeft = nextReset.getTime() - now.getTime();

      if (timeLeft > 0) {
        setTimeUntilNextReset(timeLeft);
        setIsTimerActive(true);
      } else {
        // Timer zerou, chamar reset se ainda não foi chamado neste ciclo
        const currentResetTime = nextReset.getTime();
        if (currentResetTime !== lastResetCheck) {
          setLastResetCheck(currentResetTime);
          callSpinReset();
        }
        setTimeUntilNextReset(0);
        setIsTimerActive(false);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [freeSpins, lastResetCheck]);

  const callSpinReset = async () => {
    try {
      console.log('🔄 Chamando reset de spins automaticamente...');
      const { error } = await supabase.functions.invoke('reset-spins');
      
      if (error) {
        console.error('❌ Erro ao resetar spins:', error);
      } else {
        console.log('✅ Reset de spins executado com sucesso');
        // Recarregar a página após um pequeno delay para atualizar os dados
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Erro ao chamar reset de spins:', error);
    }
  };

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