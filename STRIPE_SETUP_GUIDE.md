# Stripe Subscription Setup Guide

## Complete Guide for Implementing $5.99/Month AI Subscription with 7-Day Trial

This guide walks through setting up the complete Stripe integration using the **Vercel Stripe Integration**.

---

## 📋 Prerequisites

- Vercel account with project deployed
- Stripe account (test mode for development)
- Supabase project with migrations applied

---

## Step 1: Install Vercel Stripe Integration

### Via Vercel Dashboard:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your Recipe Generator project
3. Click **Integrations** → **Browse Marketplace**
4. Search for "Stripe" and click **Add Integration**
5. Authenticate with Stripe (use test mode initially)
6. Select options:
   - ✅ Set environment variables
   - ✅ Configure webhook endpoint
   - ✅ Use Stripe sandbox

### Automatic Configuration

The integration will automatically add these environment variables:

```bash
STRIPE_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # If webhooks enabled
```

---

## Step 2: Create Stripe Product & Price

### In Stripe Dashboard:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Click **Add Product**
3. Fill in details:
   - **Name**: AI Tools Premium
   - **Description**: Unlimited AI recipe generation and advanced features
   - **Pricing Model**: Recurring
   - **Price**: $5.99
   - **Billing Period**: Monthly
   - **Free Trial**: 7 days

4. Click **Save Product**
5. Copy the **Price ID** (looks like `price_xxxxx`)

### Add Price ID to Environment:

Add to your Vercel environment variables:

```bash
STRIPE_PRICE_ID=price_xxxxx  # Your actual Price ID
```

---

## Step 3: Apply Database Migration

Run the migration to create subscription tables:

```bash
# Make sure Supabase is running
npm run db:status

# Apply the migration
supabase db push
```

This creates:

- `user_subscriptions` table
- `user_subscription_status` view
- RLS policies
- Indexes

---

## Step 4: Configure Webhook Endpoint

### If not auto-configured by Vercel Integration:

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add Endpoint**
3. Enter your endpoint URL:
   ```
   https://your-domain.vercel.app/api/stripe/webhook
   ```
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Copy the **Signing Secret** (looks like `whsec_xxx`)
6. Add to Vercel environment variables:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

---

## Step 5: Test the Integration

### Local Testing:

1. **Start local development**:

   ```bash
   npm run dev:dual  # Starts both frontend and API
   ```

2. **Use Stripe CLI for webhooks** (optional but recommended):

   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe

   # Login
   stripe login

   # Forward webhooks to local
   stripe listen --forward-to http://localhost:3000/api/stripe/webhook
   ```

3. **Test checkout flow**:
   - Go to `http://localhost:5174/subscription`
   - Click "Start Free Trial"
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future date for expiry
   - Any 3 digits for CVC

### Test Cards:

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Requires Auth: 4000 0025 0000 3155
```

---

## Step 6: Protect AI Features

### Use the PremiumFeatureGuard component:

```tsx
import { PremiumFeatureGuard } from '@/components/subscription/PremiumFeatureGuard';

function AIFeaturePage() {
  return (
    <PremiumFeatureGuard feature="AI recipe generation">
      <AIRecipeGenerator />
    </PremiumFeatureGuard>
  );
}
```

### Or use the hook directly:

```tsx
import { useHasPremiumAccess } from '@/hooks/useSubscription';

function MyComponent() {
  const { hasAccess, isInTrial, isLoading } = useHasPremiumAccess();

  if (isLoading) return <Loader />;

  if (!hasAccess) {
    return <UpgradePrompt />;
  }

  return <PremiumContent />;
}
```

---

## Step 7: Deploy to Production

### Switch to Live Mode:

1. In Stripe Dashboard, toggle to **Live Mode** (top right)
2. Create the product and price again in live mode
3. Get new Price ID
4. Update Vercel environment variables with live keys:

   ```bash
   STRIPE_SECRET_KEY=sk_live_xxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   STRIPE_PRICE_ID=price_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_live_xxx
   ```

5. Update webhook endpoint to production URL
6. Deploy:
   ```bash
   git push  # Auto-deploys if connected to Vercel
   ```

---

## API Routes Created

### `/api/stripe/create-checkout`

- Creates Stripe Checkout session
- Handles customer creation
- Applies 7-day trial
- Returns checkout URL

### `/api/stripe/webhook`

- Receives Stripe events
- Updates subscription status in database
- Handles subscription lifecycle

---

## Database Tables

### `user_subscriptions`

Stores subscription details:

- `user_id` - Reference to auth.users
- `stripe_customer_id` - Stripe customer ID
- `stripe_subscription_id` - Stripe subscription ID
- `status` - trialing, active, canceled, past_due
- `trial_end` - Trial end timestamp
- `current_period_end` - Billing period end

### `user_subscription_status` (View)

Simplified status checking:

- `has_access` - Boolean for quick access check
- `is_in_trial` - Boolean if in trial period
- `trial_ended` - Boolean if trial ended

---

## Troubleshooting

### Webhook Not Firing:

1. Check Stripe webhook dashboard for delivery attempts
2. Verify endpoint URL is correct
3. Check STRIPE_WEBHOOK_SECRET is set
4. Look at Vercel function logs

### Subscription Not Created:

1. Check user is authenticated
2. Verify STRIPE_PRICE_ID is correct
3. Check Supabase service role key has permissions
4. Look at API route logs

### Payment Declined:

- Use test cards from Stripe docs
- Check card number, expiry, CVC are valid
- Verify billing address if required

---

## Environment Variables Checklist

Required variables in Vercel:

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `STRIPE_PRICE_ID`
- [ ] `OPENAI_API_KEY` (for AI features)

---

## Key Benefits of Vercel Integration

✅ **Automatic Setup**: Environment variables configured automatically
✅ **Webhook Management**: Webhook endpoints created and managed
✅ **Test Mode**: Easy switching between test/live modes
✅ **Security**: Secure key management through Vercel
✅ **Monitoring**: Built-in logging and error tracking

---

## Next Steps

1. Add subscription link to navigation/profile
2. Implement usage limits for free tier
3. Add subscription management (cancel, update card)
4. Send email notifications for trial ending
5. Analytics for subscription conversions

---

## Additional Resources

- [Vercel Stripe Integration Docs](https://vercel.com/marketplace/stripe)
- [Stripe Checkout Docs](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)

---

## Support

For issues:

1. Check Vercel function logs
2. Check Stripe webhook dashboard
3. Review Supabase database logs
4. Test with Stripe CLI locally
