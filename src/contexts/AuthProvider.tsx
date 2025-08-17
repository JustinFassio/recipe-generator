import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile } from '@/lib/supabase';
import { clearAuthTokens } from '@/lib/auth-utils';

interface SimpleAuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export function useAuth(): SimpleAuthContextType {
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

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setError(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Function to fetch user profile
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    console.log('🔍 fetchProfile called with userId:', userId);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, username, full_name, avatar_url, region, language, units, time_per_meal, skill_level, created_at, updated_at'
        )
        .eq('id', userId)
        .single();

      if (error) {
        // If the profiles table doesn't exist yet (migrations not run), fail gracefully
        if (error.code === '42P01') {
          console.warn(
            'Profiles table does not exist yet. Please run database migrations.'
          );
          return null;
        }
        console.error('❌ Error fetching profile:', error);
        return null;
      }

      console.log('✅ Profile fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error);
      return null;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;

    const profileData = await fetchProfile(user.id);
    setProfile(profileData);
  };

  useEffect(() => {
    let mounted = true;

    // Simple initialization with cleanup for invalid sessions
    const init = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error('Session error:', error);
          // Clear invalid session using existing utility
          await clearAuthTokens();
        }

        if (mounted) {
          if (session?.user && !error) {
            setUser(session.user);
            console.log('✅ User found:', session.user.email);

            // Fetch profile for the existing user
            console.log(
              '🔍 Fetching profile for existing user:',
              session.user.id
            );
            const profileData = await fetchProfile(session.user.id);
            console.log('📋 Profile data received:', profileData);
            setProfile(profileData);
          } else {
            setUser(null);
            setProfile(null);
            console.log('❌ No user session or session invalid');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth init error:', error);
        // Clear auth-related data on any auth error using existing utility
        await clearAuthTokens();

        if (mounted) {
          setUser(null);
          setError(null); // Don't show error, just clear everything
          setLoading(false);
        }
      }
    };

    init();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth event:', event);
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        console.log('✅ User signed in:', session.user.email);

        // Fetch profile for the signed-in user
        console.log('🔍 Fetching profile for user:', session.user.id);
        const profileData = await fetchProfile(session.user.id);
        console.log('📋 Profile data received:', profileData);
        setProfile(profileData);
      } else {
        setUser(null);
        setProfile(null);
        console.log('❌ User signed out');
      }

      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: SimpleAuthContextType = {
    user,
    profile,
    loading,
    error,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
