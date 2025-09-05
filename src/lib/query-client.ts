import { QueryClient } from '@tanstack/react-query';
import { setupQueryClientMonitoring } from './monitoring';

// Optimized QueryClient configuration for better performance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global defaults that can be overridden by individual queries
      staleTime: 2 * 60 * 1000, // 2 minutes default stale time
      gcTime: 5 * 60 * 1000, // 5 minutes garbage collection time
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      refetchOnWindowFocus: false, // Disable automatic refetch on focus by default
      refetchOnReconnect: 'always', // Refetch when reconnecting to internet
    },
    mutations: {
      retry: 1, // Retry mutations once on failure
    },
  },
});

// Setup comprehensive monitoring
setupQueryClientMonitoring(queryClient);
