import { useState, useEffect } from 'react';

export interface MobileDetectionState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  screenWidth: number;
  screenHeight: number;
}

export function useMobileDetection() {
  const [state, setState] = useState<MobileDetectionState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    hasTouch: false,
    screenWidth: 0,
    screenHeight: 0,
  });

  useEffect(() => {
    const updateDetection = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      // Determine device type based on screen width
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;

      setState({
        isMobile,
        isTablet,
        isDesktop,
        hasTouch,
        screenWidth: width,
        screenHeight: height,
      });
    };

    // Initial detection
    updateDetection();

    // Update on resize
    window.addEventListener('resize', updateDetection);

    // Cleanup
    return () => window.removeEventListener('resize', updateDetection);
  }, []);

  // Helper function to determine if we should show drawer interface
  const shouldShowDrawer = () => {
    return state.isMobile || (state.isTablet && state.hasTouch);
  };

  // Helper function to determine if we should show traditional filters
  const shouldShowTraditionalFilters = () => {
    return state.isDesktop || (state.isTablet && !state.hasTouch);
  };

  return {
    ...state,
    shouldShowDrawer,
    shouldShowTraditionalFilters,
  };
}
