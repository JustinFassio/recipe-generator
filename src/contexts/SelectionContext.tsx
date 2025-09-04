/**
 * Global context for managing category, cuisine, and mood selections
 * across all AI assistants
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface SelectionState {
  categories: string[];
  cuisines: string[];
  moods: string[];
}

interface SelectionContextType {
  selections: SelectionState;
  updateSelections: (newSelections: Partial<SelectionState>) => void;
  clearSelections: () => void;
  clearCategory: (category: string) => void;
  clearCuisine: (cuisine: string) => void;
  clearMood: (mood: string) => void;
  addCategory: (category: string) => void;
  addCuisine: (cuisine: string) => void;
  addMood: (mood: string) => void;
  removeCategory: (category: string) => void;
  removeCuisine: (cuisine: string) => void;
  removeMood: (mood: string) => void;
}

const SelectionContext = createContext<SelectionContextType | undefined>(undefined);

export const useSelections = () => {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useSelections must be used within a SelectionProvider');
  }
  return context;
};

interface SelectionProviderProps {
  children: ReactNode;
}

export const SelectionProvider: React.FC<SelectionProviderProps> = ({ children }) => {
  const [selections, setSelections] = useState<SelectionState>({
    categories: [],
    cuisines: [],
    moods: [],
  });

  const updateSelections = (newSelections: Partial<SelectionState>) => {
    setSelections(prev => ({
      ...prev,
      ...newSelections,
    }));
  };

  const clearSelections = () => {
    setSelections({
      categories: [],
      cuisines: [],
      moods: [],
    });
  };

  const clearCategory = (category: string) => {
    setSelections(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category),
    }));
  };

  const clearCuisine = (cuisine: string) => {
    setSelections(prev => ({
      ...prev,
      cuisines: prev.cuisines.filter(c => c !== cuisine),
    }));
  };

  const clearMood = (mood: string) => {
    setSelections(prev => ({
      ...prev,
      moods: prev.moods.filter(m => m !== mood),
    }));
  };

  const addCategory = (category: string) => {
    setSelections(prev => ({
      ...prev,
      categories: prev.categories.includes(category) 
        ? prev.categories 
        : [...prev.categories, category],
    }));
  };

  const addCuisine = (cuisine: string) => {
    setSelections(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(cuisine) 
        ? prev.cuisines 
        : [...prev.cuisines, cuisine],
    }));
  };

  const addMood = (mood: string) => {
    setSelections(prev => ({
      ...prev,
      moods: prev.moods.includes(mood) 
        ? prev.moods 
        : [...prev.moods, mood],
    }));
  };

  const removeCategory = (category: string) => {
    setSelections(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category),
    }));
  };

  const removeCuisine = (cuisine: string) => {
    setSelections(prev => ({
      ...prev,
      cuisines: prev.cuisines.filter(c => c !== cuisine),
    }));
  };

  const removeMood = (mood: string) => {
    setSelections(prev => ({
      ...prev,
      moods: prev.moods.filter(m => m !== mood),
    }));
  };

  const value: SelectionContextType = {
    selections,
    updateSelections,
    clearSelections,
    clearCategory,
    clearCuisine,
    clearMood,
    addCategory,
    addCuisine,
    addMood,
    removeCategory,
    removeCuisine,
    removeMood,
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};
