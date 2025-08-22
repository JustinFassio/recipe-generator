import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
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

  // Create logger instance for this component
  const logger = createLogger('AuthProvider');

  // Simple profile fetch with detailed logging and timeout
  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      try {
        logger.db(`Querying profiles table for user: ${userId}`);

        // Add timeout to prevent hanging
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Profile query timeout')), 5000);
        });

        const { data, error } = (await Promise.race([
          queryPromise,
          timeoutPromise,
        ])) as { data: Profile | null; error: PostgrestError | null };

        logger.db('Supabase query result', {
          hasData: !!data,
          error: error?.message,
          errorCode: error?.code,
        });

        if (error) {
          if (error.code === 'PGRST116') {
            logger.user('Profile not found, attempting to create...');
            // Profile doesn't exist, create it
            const { success } = await ensureUserProfile();
            if (success) {
              logger.success('Profile created, fetching again...');
              // Try again
              const { data: newData, error: newError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
              logger.db('Second fetch result', {
                hasData: !!newData,
                error: newError?.message,
              });
              return newError ? null : newData;
            } else {
              logger.failure('Profile creation failed');
            }
          } else {
            logger.error('Database error:', error);
          }
          return null;
        }

        logger.success('Profile found');
        return data;
      } catch (err) {
        logger.error('Profile fetch exception:', err);
        return null;
      }
    },
    [logger]
  );

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  }, [user, fetchProfile]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (err) {
      logger.error('Sign out error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        logger.auth('Initializing AuthProvider...');

        // Add timeout to initial session check
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Initial session timeout')), 5000);
        });

        const {
          data: { session },
        } = (await Promise.race([sessionPromise, timeoutPromise])) as {
          data: { session: Session | null };
        };

        if (!isMounted) return;

        if (session?.user) {
          logger.auth(`Initial session found: ${session.user.id}`);
          setUser(session.user);

          // Fetch profile non-blocking
          fetchProfile(session.user.id)
            .then((profileData) => {
              logger.db(`Initial profile fetch result: ${!!profileData}`);
              if (isMounted) setProfile(profileData);
            })
            .catch((err) => {
              logger.error('Initial profile fetch failed:', err);
            });
        } else {
          logger.auth('No initial session found');
        }

        logger.success('Setting loading to false');
        setLoading(false);
      } catch (err) {
        logger.error('Initial session error:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Authentication error');
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        logger.auth(`Auth state change: ${event}`, session?.user?.id);

        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          logger.user(`User signed in: ${session.user.id}`);
          setUser(session.user);
          setError(null);

          // Set loading to false IMMEDIATELY when user signs in
          logger.auth('Setting loading to false immediately after SIGNED_IN');
          setLoading(false);

          // Fetch profile in background with detailed logging - don't block UI
          logger.db(`Starting profile fetch for user: ${session.user.id}`);
          fetchProfile(session.user.id)
            .then((profileData) => {
              logger.db('Profile fetch result', {
                success: !!profileData,
                hasData: !!profileData,
              });
              setProfile(profileData);
            })
            .catch((profileError) => {
              logger.error('Profile fetch error:', profileError);
              // Continue without profile - user can still use the app
            });
        } else if (event === 'SIGNED_OUT') {
          logger.auth('User signed out');
          setUser(null);
          setProfile(null);
          setError(null);
          setLoading(false);
        }
      }
    );

    return () => {
      logger.auth('Cleaning up AuthProvider...');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, logger]);

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
