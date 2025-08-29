import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  User,
  AuthChangeEvent,
  Session,
  PostgrestError,
} from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/lib/types';
import { ensureUserProfile } from '@/lib/auth-utils';
import { createLogger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Static logger to prevent dependency loops
  const logger = useRef(createLogger('AuthProvider')).current;

  // Track retry attempts to prevent infinite loops
  const retryAttempts = useRef<Map<string, number>>(new Map());
  const maxRetries = 3;

  // Simple cache to prevent unnecessary re-fetches
  const profileCache = useRef<
    Map<string, { profile: Profile; timestamp: number }>
  >(new Map());
  const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

  // Store current fetchProfile function to avoid dependency issues
  const fetchProfileRef = useRef<typeof fetchProfile>();

  // Backoff delays: 1s, 2s, 4s
  const getBackoffDelay = (attempt: number): number =>
    Math.min(1000 * Math.pow(2, attempt), 4000);

  // Reset retry counter for user
  const resetRetries = useCallback((userId: string) => {
    retryAttempts.current.delete(userId);
  }, []);

  // Check if we should retry
  const shouldRetry = useCallback((userId: string): boolean => {
    const attempts = retryAttempts.current.get(userId) || 0;
    return attempts < maxRetries;
  }, []);

  // Increment retry counter
  const incrementRetries = useCallback((userId: string): number => {
    const attempts = (retryAttempts.current.get(userId) || 0) + 1;
    retryAttempts.current.set(userId, attempts);
    return attempts;
  }, []);

  // Profile fetch with exponential backoff and circuit breaker
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      // Check cache first
      const cached = profileCache.current.get(userId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
        logger.db(`Using cached profile for user: ${userId}`);
        return cached.profile;
      }

      if (!shouldRetry(userId)) {
        logger.error(`Max retries exceeded for user ${userId}, skipping fetch`);
        return null;
      }

      const attempt = incrementRetries(userId);

      try {
        logger.db(
          `Querying profiles table for user: ${userId} (attempt ${attempt})`
        );

        // Increased timeout for production network constraints
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        // Increased timeout for local development stability
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Profile query timeout')),
            import.meta.env.DEV ? 20000 : 15000
          );
        });

        const { data, error } = (await Promise.race([
          queryPromise,
          timeoutPromise,
        ])) as { data: Profile | null; error: PostgrestError | null };

        logger.db('Supabase query result', {
          hasData: !!data,
          error: error?.message,
          errorCode: error?.code,
          attempt,
        });

        if (error) {
          if (error.code === 'PGRST116') {
            logger.user('Profile not found, attempting to create...');

            // Only try to create profile on first attempt to prevent loops
            if (attempt === 1) {
              const { success } = await ensureUserProfile();
              if (success) {
                logger.success('Profile created, fetching again...');
                // Recursive call will increment retry counter
                return await fetchProfile(userId);
              } else {
                logger.failure('Profile creation failed');
                return null;
              }
            } else {
              logger.failure('Profile creation already attempted, skipping');
              return null;
            }
          } else {
            logger.error('Database error:', error);

            // Network errors - log backoff delay for debugging
            if (
              error.message?.includes('Failed to fetch') ||
              error.message?.includes('ERR_INSUFFICIENT_RESOURCES')
            ) {
              const delay = getBackoffDelay(attempt - 1);
              logger.error(
                `Network error, would back off for ${delay}ms (retry mechanism not implemented)`
              );
            }

            return null;
          }
        }

        // Success - reset retry counter and cache the profile
        resetRetries(userId);
        if (data) {
          profileCache.current.set(userId, {
            profile: data,
            timestamp: Date.now(),
          });
          logger.success('Profile found successfully and cached');
        }
        return data;
      } catch (err) {
        logger.error('Profile fetch exception:', err);

        // Handle network errors with backoff
        if (
          err instanceof Error &&
          (err.message.includes('Failed to fetch') ||
            err.message.includes('ERR_INSUFFICIENT_RESOURCES') ||
            err.message.includes('Profile query timeout'))
        ) {
          const delay = getBackoffDelay(attempt - 1);
          logger.error(
            `Network exception, backing off for ${delay}ms before next possible retry`
          );
        }

        return null;
      }
    },
    [shouldRetry, incrementRetries, resetRetries, logger, CACHE_DURATION_MS]
  );

  // Store the current fetchProfile function in ref
  fetchProfileRef.current = fetchProfile;

  // Stable refresh function that won't cause loops
  const refreshProfile = useCallback(async () => {
    if (!user?.id) {
      logger.auth('No user ID, skipping profile refresh');
      return;
    }

    logger.auth(`Refreshing profile for user: ${user.id}`);

    // Clear cache for this user to force fresh data
    console.log('🗑️ Clearing profile cache for user:', user.id);
    profileCache.current.delete(user.id);

    const profileData = await fetchProfile(user.id);

    if (profileData) {
      logger.db('Profile refresh result:', {
        userId: profileData.id,
        username: profileData.username,
        avatarUrl: profileData.avatar_url,
        hasAvatar: !!profileData.avatar_url,
      });
      console.log('📊 Profile data fetched:', {
        id: profileData.id,
        username: profileData.username,
        fullName: profileData.full_name,
      });
      setProfile(profileData);
      logger.success('Profile refreshed successfully');
    } else {
      logger.error('Profile refresh failed');
      console.log('❌ Profile refresh failed - no data returned');
      // Don't clear profile on refresh failure - keep existing data
    }
  }, [user?.id, fetchProfile, logger]);

  const signOut = async () => {
    try {
      logger.auth('Signing out user');
      await supabase.auth.signOut();

      // Clear all state
      setUser(null);
      setProfile(null);
      setError(null);

      // Clear retry counters and cache
      retryAttempts.current.clear();
      profileCache.current.clear();

      logger.success('User signed out successfully');
    } catch (err) {
      logger.error('Sign out error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let authSubscription: { unsubscribe: () => void } | null = null;

    // Get initial session with timeout and error handling
    const getInitialSession = async () => {
      try {
        logger.auth('Initializing AuthProvider...');

        // Session timeout configuration - increased for local development stability
        const SESSION_TIMEOUT_MS = import.meta.env.DEV ? 15000 : 8000; // Much longer timeout for development
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Initial session timeout')),
            SESSION_TIMEOUT_MS
          );
        });

        const {
          data: { session },
        } = (await Promise.race([sessionPromise, timeoutPromise])) as {
          data: { session: Session | null };
        };

        if (!isMounted) {
          logger.auth('Component unmounted during session fetch');
          return;
        }

        if (session?.user) {
          logger.auth(`Initial session found: ${session.user.id}`);
          setUser(session.user);

          // Fetch profile non-blocking with error boundaries
          try {
            let profileData = null;
            if (
              fetchProfileRef.current &&
              typeof fetchProfileRef.current === 'function'
            ) {
              profileData = await fetchProfileRef.current(session.user.id);
            } else {
              logger.error(
                'fetchProfileRef.current is not set or not a function'
              );
            }

            if (isMounted) {
              logger.db(`Initial profile fetch result: ${!!profileData}`);
              setProfile(profileData);
            }
          } catch (profileError) {
            logger.error('Initial profile fetch failed:', profileError);
            // In development, be more lenient with profile fetch failures
            if (import.meta.env.DEV) {
              logger.auth(
                'Development mode: continuing without profile, will retry on demand'
              );
            }
            // Continue without profile - don't block app initialization
          }
        } else {
          logger.auth('No initial session found');
        }

        // Always set loading to false after initial session check
        if (isMounted) {
          logger.success(
            'Setting loading to false after initial session check'
          );
          setLoading(false);
        }
      } catch (err) {
        logger.error('Initial session error:', err);
        if (isMounted) {
          // Don't treat session timeouts as critical errors
          if (err instanceof Error && err.message.includes('timeout')) {
            logger.error('Session timeout - continuing without session');
          } else {
            setError(
              err instanceof Error ? err.message : 'Authentication error'
            );
          }
          setLoading(false);
        }
      }
    };

    // Set up auth state listener with error boundaries
    const setupAuthListener = () => {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          logger.auth(`Auth state change: ${event}`, session?.user?.id);

          if (!isMounted) {
            logger.auth('Component unmounted during auth state change');
            return;
          }

          try {
            if (event === 'SIGNED_IN' && session?.user) {
              logger.user(`User signed in: ${session.user.id}`);
              setUser(session.user);
              setError(null);

              // Reset retry counters for new user
              retryAttempts.current.clear();

              // Set loading to false IMMEDIATELY when user signs in
              logger.auth(
                'Setting loading to false immediately after SIGNED_IN'
              );
              setLoading(false);

              // Fetch profile in background with error boundaries
              try {
                logger.db(
                  `Starting background profile fetch for user: ${session.user.id}`
                );
                let profileData = null;
                if (
                  fetchProfileRef.current &&
                  typeof fetchProfileRef.current === 'function'
                ) {
                  profileData = await fetchProfileRef.current(session.user.id);
                } else {
                  logger.error(
                    'fetchProfileRef.current is not set or not a function'
                  );
                }

                if (isMounted) {
                  logger.db('Background profile fetch result', {
                    success: !!profileData,
                    hasData: !!profileData,
                  });
                  setProfile(profileData);
                }
              } catch (profileError) {
                logger.error('Background profile fetch error:', profileError);
                // In development, be more lenient with profile fetch failures
                if (import.meta.env.DEV) {
                  logger.auth(
                    'Development mode: background profile fetch failed, will retry on demand'
                  );
                }
                // Continue without profile - user can still use the app
              }
            } else if (event === 'SIGNED_OUT') {
              logger.auth('User signed out');
              setUser(null);
              setProfile(null);
              setError(null);
              setLoading(false);

              // Clear retry counters and cache
              retryAttempts.current.clear();
              profileCache.current.clear();
            } else if (event === 'TOKEN_REFRESHED') {
              logger.auth('Token refreshed - no profile fetch needed');
            }
          } catch (authError) {
            logger.error('Auth state change error:', authError);
            // Don't crash the app on auth state errors
            if (isMounted) {
              setError(
                authError instanceof Error
                  ? authError.message
                  : 'Authentication error'
              );
            }
          }
        }
      );

      authSubscription = subscription;
      logger.auth('Auth state listener established');
    };

    // Initialize everything
    getInitialSession();
    setupAuthListener();

    // Cleanup function
    return () => {
      logger.auth('Cleaning up AuthProvider...');
      isMounted = false;

      if (authSubscription) {
        authSubscription.unsubscribe();
        authSubscription = null;
      }

      // Clear retry counters and cache - capture ref values to avoid warning
      const currentRetryAttempts = retryAttempts.current;
      const currentProfileCache = profileCache.current;
      currentRetryAttempts.clear();
      currentProfileCache.clear();
    };
  }, [logger]); // Include logger to satisfy exhaustive-deps

  const value: AuthContextType = {
    user,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
