import { createContext, useContext, type ReactNode } from 'react';
import { useTrainerMode } from '@/hooks/useTrainerMode';

const TrainerModeContext = createContext<ReturnType<typeof useTrainerMode> | null>(null);

export const TrainerModeProvider = ({ children }: { children: ReactNode }) => {
  const trainerMode = useTrainerMode();
  return (
    <TrainerModeContext.Provider value={trainerMode}>
      {children}
    </TrainerModeContext.Provider>
  );
};

export const useTrainerModeContext = () => {
  const context = useContext(TrainerModeContext);
  if (!context) {
    throw new Error('useTrainerModeContext must be used within TrainerModeProvider');
  }
  return context;
};
