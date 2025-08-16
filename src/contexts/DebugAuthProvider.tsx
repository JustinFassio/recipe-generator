import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';

// Simple auth context for debugging
interface DebugAuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DebugAuthContext = createContext<DebugAuthContextType | undefined>(
  undefined
);

export function useAuth(): DebugAuthContextType {
  const context = useContext(DebugAuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a DebugAuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🔍 DebugAuthProvider: Current state:', {
    userEmail: user?.email || 'none',
    profileUsername: profile?.username || 'none',
    loading,
    error,
  });

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('🔍 Profile refresh error:', profileError);
        setError(`Profile error: ${profileError.message}`);
      } else {
        console.log('🔍 Profile refreshed:', profileData);
        setProfile(profileData);
      }
    } catch (error) {
      console.error('🔍 Error refreshing profile:', error);
    }
  };

  useEffect(() => {
    let mounted = true;
    console.log('🔍 DebugAuthProvider: Initializing...');

    const initializeAuth = async (): Promise<void> => {
      try {
        console.log('🔍 Getting initial session...');
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('🔍 Session error:', error);
          setError(`Session error: ${error.message}`);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        console.log('🔍 Session result:', {
          hasSession: !!session,
          userEmail: session?.user?.email,
        });

        if (session?.user) {
          console.log('🔍 Fetching user profile...');
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError) {
            console.error('🔍 Profile fetch error:', profileError);
            setError(`Profile error: ${profileError.message}`);
          } else {
            console.log('🔍 Profile fetched:', profileData);
            setProfile(profileData);
          }
        } else {
          setProfile(null);
        }

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
          setError(null);
          console.log('🔍 Auth initialization complete');
        }
      } catch (error) {
        console.error('🔍 Error initializing auth:', error);
        setError(
          `Init error: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 Auth state change:', event, session?.user?.email);
      if (!mounted) return;

      setUser(session?.user ?? null);
      if (session?.user) {
        console.log('🔍 Auth state change: Fetching profile...');
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.error(
            '🔍 Auth state change: Profile fetch error:',
            profileError
          );
          setError(`Profile error: ${profileError.message}`);
        } else {
          console.log('🔍 Auth state change: Profile fetched:', profileData);
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      setError(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      console.log('🔍 DebugAuthProvider: Cleanup');
    };
  }, []);

  const value: DebugAuthContextType = {
    user,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
  };

  return React.createElement(DebugAuthContext.Provider, { value }, children);
}
