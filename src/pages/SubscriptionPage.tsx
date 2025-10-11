import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useSubscription,
  useSubscriptionStatus,
} from '@/hooks/useSubscription';
import { useCreateCheckout } from '@/hooks/useCreateCheckout';
import { Loader2, Check, Sparkles, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';

export function SubscriptionPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const { data: subscription, isLoading: subLoading } = useSubscription();
  const { data: status } = useSubscriptionStatus();
  const createCheckout = useCreateCheckout();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setAuthLoading(false);
    });
  }, []);

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Sign In Required</h1>
        <p className="text-muted-foreground mb-8">
          Please sign in to view subscription options.
        </p>
        <Button onClick={() => navigate('/signin')}>Sign In</Button>
      </div>
    );
  }

  if (subLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const hasActiveSubscription = status?.has_access;
  const isInTrial = status?.is_in_trial;

  const handleSubscribe = () => {
    createCheckout.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Upgrade to Premium</h1>
          <p className="text-xl text-muted-foreground">
            Unlock unlimited AI-powered recipe generation
          </p>
        </div>

        {/* Current Status */}
        {hasActiveSubscription && (
          <Card className="mb-8 border-green-500">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Subscription</CardTitle>
                {isInTrial ? (
                  <Badge variant="secondary">Trial Active</Badge>
                ) : (
                  <Badge variant="default">Active</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Status:</strong> {subscription?.status}
                </p>
                {status?.trial_end && isInTrial && (
                  <p>
                    <strong>Trial ends:</strong>{' '}
                    {new Date(status.trial_end).toLocaleDateString()}
                  </p>
                )}
                {status?.current_period_end && !isInTrial && (
                  <p>
                    <strong>Next billing date:</strong>{' '}
                    {new Date(status.current_period_end).toLocaleDateString()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pricing Card */}
        {!hasActiveSubscription && (
          <Card className="mb-8">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-3xl">Premium Plan</CardTitle>
              <CardDescription>
                Everything you need to cook smarter
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$5.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <Badge variant="secondary" className="mt-2">
                7-Day Free Trial
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <Feature text="Unlimited AI recipe generation" />
                <Feature text="Advanced recipe customization" />
                <Feature text="AI-powered meal planning" />
                <Feature text="Smart grocery list optimization" />
                <Feature text="Dietary restriction support" />
                <Feature text="Priority customer support" />
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubscribe}
                disabled={createCheckout.isPending}
              >
                {createCheckout.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating checkout...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Free Trial
                  </>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground mt-4">
                Cancel anytime. No commitment required.
              </p>

              {createCheckout.isError && (
                <p className="text-sm text-destructive text-center mt-2">
                  {createCheckout.error instanceof Error
                    ? createCheckout.error.message
                    : 'Failed to create checkout session'}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">What's Included</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Feature text="No limits on AI recipe requests" />
              <Feature text="Access to all premium features" />
              <Feature text="Regular updates and improvements" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Trial Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                • Your 7-day free trial starts immediately
              </p>
              <p className="text-sm">
                • Cancel anytime during the trial - no charges
              </p>
              <p className="text-sm">
                • After trial: $5.99/month, billed monthly
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

export default SubscriptionPage;
