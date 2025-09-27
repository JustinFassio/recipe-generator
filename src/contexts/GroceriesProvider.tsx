import { createContext, useContext, ReactNode } from 'react';
import { useGroceries, UseGroceriesReturn } from '@/hooks/useGroceries';

type GroceriesContextType = UseGroceriesReturn;

const GroceriesContext = createContext<GroceriesContextType | undefined>(
  undefined
);

interface GroceriesProviderProps {
  children: ReactNode;
}

export function GroceriesProvider({ children }: GroceriesProviderProps) {
  const groceries = useGroceries();

  return (
    <GroceriesContext.Provider value={groceries}>
      {children}
    </GroceriesContext.Provider>
  );
}

export function useGroceriesContext(): GroceriesContextType {
  const context = useContext(GroceriesContext);
  if (context === undefined) {
    throw new Error(
      'useGroceriesContext must be used within a GroceriesProvider'
    );
  }
  return context;
}
