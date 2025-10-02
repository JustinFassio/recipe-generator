import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

interface ImageGenerationState {
  isGenerating: boolean;
  progress: number;
  recipeId?: string;
  error?: string;
}

interface ImageGenerationContextType {
  generationState: ImageGenerationState;
  startGeneration: (recipeId: string) => void;
  updateProgress: (progress: number) => void;
  completeGeneration: (imageUrl?: string, error?: string) => void;
  clearGeneration: () => void;
}

const ImageGenerationContext = createContext<
  ImageGenerationContextType | undefined
>(undefined);

export function ImageGenerationProvider({ children }: { children: ReactNode }) {
  const [generationState, setGenerationState] = useState<ImageGenerationState>({
    isGenerating: false,
    progress: 0,
  });

  const startGeneration = useCallback((recipeId: string) => {
    setGenerationState({
      isGenerating: true,
      progress: 10,
      recipeId,
      error: undefined,
    });
  }, []);

  const updateProgress = useCallback((progress: number) => {
    setGenerationState((prev) => ({
      ...prev,
      progress: Math.min(100, Math.max(0, progress)),
    }));
  }, []);

  const completeGeneration = useCallback(
    (_imageUrl?: string, error?: string) => {
      setGenerationState((prev) => ({
        ...prev,
        isGenerating: false,
        progress: 100,
        error,
      }));

      // Clear the state after a delay
      setTimeout(() => {
        setGenerationState({
          isGenerating: false,
          progress: 0,
        });
      }, 2000);
    },
    []
  );

  const clearGeneration = useCallback(() => {
    setGenerationState({
      isGenerating: false,
      progress: 0,
    });
  }, []);

  const value: ImageGenerationContextType = {
    generationState,
    startGeneration,
    updateProgress,
    completeGeneration,
    clearGeneration,
  };

  return (
    <ImageGenerationContext.Provider value={value}>
      {children}
    </ImageGenerationContext.Provider>
  );
}

export function useImageGenerationContext() {
  const context = useContext(ImageGenerationContext);
  if (context === undefined) {
    throw new Error(
      'useImageGenerationContext must be used within an ImageGenerationProvider'
    );
  }
  return context;
}
