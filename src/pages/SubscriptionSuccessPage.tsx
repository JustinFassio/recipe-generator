import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export function SubscriptionSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate subscription queries to refetch updated status
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
  }, [queryClient]);

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-3xl">Welcome to Premium!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <p className="text-lg font-medium">
                Your 7-day free trial has started
              </p>
            </div>

            <div className="bg-muted p-6 rounded-lg space-y-3">
              <h3 className="font-semibold text-lg">What happens next?</h3>
              <ul className="text-sm text-left space-y-2">
                <li>✓ You now have unlimited access to all AI features</li>
                <li>✓ Your trial lasts for 7 days from today</li>
                <li>✓ After the trial, you'll be charged $5.99/month</li>
                <li>✓ Cancel anytime from your account settings</li>
              </ul>
            </div>

            <div className="flex gap-4 justify-center pt-4">
              <Button onClick={() => navigate('/recipes')} size="lg">
                Start Creating Recipes
              </Button>
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                size="lg"
              >
                Manage Subscription
              </Button>
            </div>

            {sessionId && (
              <p className="text-xs text-muted-foreground">
                Session ID: {sessionId.slice(0, 20)}...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SubscriptionSuccessPage;
