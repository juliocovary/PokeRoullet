import React, { createContext, useContext, useState, useCallback } from 'react';

interface DataRefreshState {
  missionsNeedRefresh: boolean;
  achievementsNeedRefresh: boolean;
  inventoryNeedRefresh: boolean;
  pokedexNeedRefresh: boolean;
  profileNeedRefresh: boolean;
  eventNeedRefresh: boolean;
}

interface DataRefreshContextType extends DataRefreshState {
  markMissionsForRefresh: () => void;
  markAchievementsForRefresh: () => void;
  markInventoryForRefresh: () => void;
  markPokedexForRefresh: () => void;
  markProfileForRefresh: () => void;
  markEventForRefresh: () => void;
  markAllForRefresh: () => void;
  clearMissionsRefresh: () => void;
  clearAchievementsRefresh: () => void;
  clearInventoryRefresh: () => void;
  clearPokedexRefresh: () => void;
  clearProfileRefresh: () => void;
  clearEventRefresh: () => void;
}

const DataRefreshContext = createContext<DataRefreshContextType | null>(null);

export const DataRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DataRefreshState>({
    missionsNeedRefresh: false,
    achievementsNeedRefresh: false,
    inventoryNeedRefresh: false,
    pokedexNeedRefresh: false,
    profileNeedRefresh: false,
    eventNeedRefresh: false,
  });

  const markMissionsForRefresh = useCallback(() => {
    setState(prev => ({ ...prev, missionsNeedRefresh: true }));
  }, []);

  const markAchievementsForRefresh = useCallback(() => {
    setState(prev => ({ ...prev, achievementsNeedRefresh: true }));
  }, []);

  const markInventoryForRefresh = useCallback(() => {
    setState(prev => ({ ...prev, inventoryNeedRefresh: true }));
  }, []);

  const markPokedexForRefresh = useCallback(() => {
    setState(prev => ({ ...prev, pokedexNeedRefresh: true }));
  }, []);

  const markProfileForRefresh = useCallback(() => {
    setState(prev => ({ ...prev, profileNeedRefresh: true }));
  }, []);

  const markEventForRefresh = useCallback(() => {
    setState(prev => ({ ...prev, eventNeedRefresh: true }));
  }, []);

  const markAllForRefresh = useCallback(() => {
    setState({
      missionsNeedRefresh: true,
      achievementsNeedRefresh: true,
      inventoryNeedRefresh: true,
      pokedexNeedRefresh: true,
      profileNeedRefresh: true,
      eventNeedRefresh: true,
    });
  }, []);

  const clearMissionsRefresh = useCallback(() => {
    setState(prev => ({ ...prev, missionsNeedRefresh: false }));
  }, []);

  const clearAchievementsRefresh = useCallback(() => {
    setState(prev => ({ ...prev, achievementsNeedRefresh: false }));
  }, []);

  const clearInventoryRefresh = useCallback(() => {
    setState(prev => ({ ...prev, inventoryNeedRefresh: false }));
  }, []);

  const clearPokedexRefresh = useCallback(() => {
    setState(prev => ({ ...prev, pokedexNeedRefresh: false }));
  }, []);

  const clearProfileRefresh = useCallback(() => {
    setState(prev => ({ ...prev, profileNeedRefresh: false }));
  }, []);

  const clearEventRefresh = useCallback(() => {
    setState(prev => ({ ...prev, eventNeedRefresh: false }));
  }, []);

  return (
    <DataRefreshContext.Provider value={{
      ...state,
      markMissionsForRefresh,
      markAchievementsForRefresh,
      markInventoryForRefresh,
      markPokedexForRefresh,
      markProfileForRefresh,
      markEventForRefresh,
      markAllForRefresh,
      clearMissionsRefresh,
      clearAchievementsRefresh,
      clearInventoryRefresh,
      clearPokedexRefresh,
      clearProfileRefresh,
      clearEventRefresh,
    }}>
      {children}
    </DataRefreshContext.Provider>
  );
};

export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext);
  if (!context) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
};
