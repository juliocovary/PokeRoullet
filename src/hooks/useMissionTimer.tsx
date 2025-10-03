import { useState, useEffect } from 'react';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const useMissionTimer = () => {
  const [dailyTimeRemaining, setDailyTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [weeklyTimeRemaining, setWeeklyTimeRemaining] = useState<TimeRemaining>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  const calculateTimeRemaining = (targetDate: Date): TimeRemaining => {
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();
    
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { days, hours, minutes, seconds };
  };

  const getNextMidnight = (): Date => {
    const tomorrow = new Date();
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
    tomorrow.setUTCHours(0, 0, 0, 0);
    return tomorrow;
  };

  const getNextSunday = (): Date => {
    const now = new Date();
    const nextSunday = new Date(now);
    const daysUntilSunday = (7 - now.getUTCDay()) % 7;
    
    if (daysUntilSunday === 0) {
      // If today is Sunday, get next Sunday
      nextSunday.setUTCDate(now.getUTCDate() + 7);
    } else {
      nextSunday.setUTCDate(now.getUTCDate() + daysUntilSunday);
    }
    
    nextSunday.setUTCHours(0, 0, 0, 0);
    return nextSunday;
  };

  useEffect(() => {
    const updateTimers = () => {
      const nextMidnight = getNextMidnight();
      const nextSunday = getNextSunday();
      
      setDailyTimeRemaining(calculateTimeRemaining(nextMidnight));
      setWeeklyTimeRemaining(calculateTimeRemaining(nextSunday));
    };

    // Update immediately
    updateTimers();

    // Update every second
    const interval = setInterval(updateTimers, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (time: TimeRemaining): string => {
    if (time.days > 0) {
      return `${time.days}d ${time.hours}h ${time.minutes}m`;
    }
    return `${time.hours}h ${time.minutes}m ${time.seconds}s`;
  };

  return {
    dailyTimeRemaining,
    weeklyTimeRemaining,
    formatDailyTime: () => formatTime(dailyTimeRemaining),
    formatWeeklyTime: () => formatTime(weeklyTimeRemaining)
  };
};