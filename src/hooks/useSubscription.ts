import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SubscriptionStatus {
  user_id: string;
  status: string;
  trial_end: string | null;
  current_period_end: string | null;
  has_access: boolean;
  is_in_trial: boolean;
  trial_ended: boolean;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Hook to get user's subscription status (simplified view)
 */
export function useSubscriptionStatus() {
  return useQuery<SubscriptionStatus | null>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscription_status')
        .select('*')
        .maybeSingle();

      if (error) {
        // If no subscription exists, return null (not an error)
        if (error.code === 'PGRST116') {
          return null;
        }
        // If table doesn't exist, return null gracefully
        if (error.code === '42P01' || error.code === 'PGRST205') {
          console.warn(
            'Subscription table not found - migration may not be applied yet'
          );
          return null;
        }
        throw error;
      }

      return data;
    },
    retry: false, // Don't retry if table doesn't exist
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Hook to get user's full subscription details
 */
export function useSubscription() {
  return useQuery<UserSubscription | null>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        // If table doesn't exist, return null gracefully
        if (error.code === '42P01' || error.code === 'PGRST205') {
          console.warn(
            'Subscription table not found - migration may not be applied yet'
          );
          return null;
        }
        throw error;
      }

      return data;
    },
    retry: false, // Don't retry if table doesn't exist
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Helper function to check if user has premium access
 */
export function useHasPremiumAccess() {
  const { data: status, isLoading } = useSubscriptionStatus();

  return {
    hasAccess: status?.has_access ?? false,
    isInTrial: status?.is_in_trial ?? false,
    isLoading,
    status: status?.status ?? 'none',
  };
}
