import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface CheckoutResponse {
  sessionId: string;
  url: string;
}

/**
 * Hook to create a Stripe checkout session and redirect user
 */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: async () => {
      // Get current session
      console.log('[Checkout] Fetching session...');
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log('[Checkout] Session exists:', !!session);
      console.log('[Checkout] Session error:', sessionError);

      if (sessionError || !session) {
        console.error('[Checkout] No valid session found');
        throw new Error('You must be logged in to subscribe');
      }

      console.log('[Checkout] User email:', session.user?.email);
      console.log('[Checkout] Calling API...');

      // Call our API route to create checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('[Checkout] API response status:', response.status);

      if (!response.ok) {
        const text = await response.text();
        console.error('[Checkout] API error:', text);
        throw new Error(text || `HTTP ${response.status}`);
      }

      const data: CheckoutResponse = await response.json();
      console.log('[Checkout] Success! Redirecting to Stripe...');
      return data;
    },
    onSuccess: (data) => {
      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });
}
