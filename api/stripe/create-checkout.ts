import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get authorization token
    const authHeader = req.headers.authorization;
    console.log('[Checkout] Auth header present:', !!authHeader);

    if (!authHeader) {
      console.error('[Checkout] No authorization header provided');
      return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('[Checkout] Token length:', token.length);

    // Verify user with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    console.log('[Checkout] Auth error:', authError);
    console.log('[Checkout] User found:', !!user);

    if (authError || !user) {
      console.error(
        '[Checkout] Authentication failed:',
        authError?.message || 'No user'
      );
      return res.status(401).json({
        error: 'Unauthorized',
        details: authError?.message || 'No user found',
      });
    }

    console.log('[Checkout] Authenticated as:', user.email);

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (existingSubscription && existingSubscription.status === 'active') {
      return res
        .status(400)
        .json({ error: 'User already has an active subscription' });
    }

    // Get or create Stripe customer
    let customerId = existingSubscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    // Get origin for redirect URLs
    const origin = req.headers.origin || 'http://localhost:5174';

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          // Replace with your actual Stripe Price ID
          // Create this in Stripe Dashboard: Products → Add Product → $5.99/month
          price: process.env.STRIPE_PRICE_ID || 'price_xxxxx',
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      success_url: `${origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/subscription`,
      metadata: {
        supabase_user_id: user.id,
      },
      allow_promotion_codes: true, // Allow coupon codes
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
