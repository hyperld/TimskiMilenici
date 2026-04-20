import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { StoreContext } from '../types';

interface PawPalContextValue {
  storeContext: StoreContext | null;
  setStoreContext: (ctx: StoreContext | null) => void;
}

const PawPalContext = createContext<PawPalContextValue>({
  storeContext: null,
  setStoreContext: () => {},
});

export const PawPalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storeContext, setStoreContextState] = useState<StoreContext | null>(null);

  const setStoreContext = useCallback((ctx: StoreContext | null) => {
    setStoreContextState(ctx);
  }, []);

  const value = useMemo(
    () => ({ storeContext, setStoreContext }),
    [storeContext, setStoreContext],
  );

  return <PawPalContext.Provider value={value}>{children}</PawPalContext.Provider>;
};

export const usePawPal = () => useContext(PawPalContext);
