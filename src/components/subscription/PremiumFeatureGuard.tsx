import { ReactNode } from 'react';
import { useHasPremiumAccess } from '@/hooks/useSubscription';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

interface PremiumFeatureGuardProps {
  children: ReactNode;
  feature?: string;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on premium subscription status
 * Shows upgrade prompt if user doesn't have premium access
 */
export function PremiumFeatureGuard({
  children,
  feature = 'premium feature',
  fallback,
}: PremiumFeatureGuardProps) {
  const { hasAccess, isLoading } = useHasPremiumAccess();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default upgrade prompt
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-primary" />
          <CardTitle>Premium Feature</CardTitle>
        </div>
        <CardDescription>
          This {feature} requires a premium subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/5 p-4 rounded-lg">
          <p className="text-sm mb-2">✨ Premium includes:</p>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Unlimited AI recipe generation</li>
            <li>• Advanced customization options</li>
            <li>• Priority support</li>
            <li>• 7-day free trial</li>
          </ul>
        </div>

        <Button onClick={() => navigate('/subscription')} className="w-full">
          <Sparkles className="mr-2 h-4 w-4" />
          Start Free Trial
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Only $5.99/month after trial • Cancel anytime
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Inline premium badge for showing trial/premium status
 */
export function PremiumBadge() {
  const { hasAccess, isInTrial, isLoading } = useHasPremiumAccess();

  if (isLoading || !hasAccess) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
      <Sparkles className="h-3 w-3" />
      {isInTrial ? 'Trial Active' : 'Premium'}
    </span>
  );
}

export default PremiumFeatureGuard;
