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

  // Simple profile fetch with detailed logging and timeout
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      console.log('🗃️ Querying profiles table for user:', userId);

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

      console.log('🗃️ Supabase query result:', {
        data,
        error,
        errorCode: error?.code,
      });

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('👤 Profile not found, attempting to create...');
          // Profile doesn't exist, create it
          const { success } = await ensureUserProfile();
          if (success) {
            console.log('✅ Profile created, fetching again...');
            // Try again
            const { data: newData, error: newError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();
            console.log('🗃️ Second fetch result:', {
              data: newData,
              error: newError,
            });
            return newError ? null : newData;
          } else {
            console.log('❌ Profile creation failed');
          }
        } else {
          console.error('❌ Database error:', error);
        }
        return null;
      }

      console.log('✅ Profile found:', data);
      return data;
    } catch (err) {
      console.error('❌ Profile fetch exception:', err);
      return null;
    }
  };

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  }, [user]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        console.log('🚀 Initializing AuthProvider...');

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
          console.log('🔑 Initial session found:', session.user.id);
          setUser(session.user);

          // Fetch profile non-blocking
          fetchProfile(session.user.id)
            .then((profileData) => {
              console.log('📦 Initial profile fetch result:', !!profileData);
              if (isMounted) setProfile(profileData);
            })
            .catch((err) => {
              console.error('❌ Initial profile fetch failed:', err);
            });
        } else {
          console.log('🚫 No initial session found');
        }

        console.log('✅ Setting loading to false');
        setLoading(false);
      } catch (err) {
        console.error('❌ Initial session error:', err);
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
        console.log('🔔 Auth state change:', event, session?.user?.id);

        if (!isMounted) return;

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('👤 User signed in:', session.user.id);
          setUser(session.user);
          setError(null);

          // Set loading to false IMMEDIATELY when user signs in
          console.log(
            '⚡ Setting loading to false immediately after SIGNED_IN'
          );
          setLoading(false);

          // Fetch profile in background with detailed logging - don't block UI
          console.log('🔍 Starting profile fetch for user:', session.user.id);
          fetchProfile(session.user.id)
            .then((profileData) => {
              console.log('📦 Profile fetch result:', {
                success: !!profileData,
                data: profileData,
              });
              setProfile(profileData);
            })
            .catch((profileError) => {
              console.error('❌ Profile fetch error:', profileError);
              // Continue without profile - user can still use the app
            });
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setUser(null);
          setProfile(null);
          setError(null);
          setLoading(false);
        }
      }
    );

    return () => {
      console.log('🧹 Cleaning up AuthProvider...');
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

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
