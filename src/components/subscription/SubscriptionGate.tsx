import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Sparkles, ChefHat, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHasPremiumAccess } from '@/hooks/useSubscription';
import { useCreateCheckout } from '@/hooks/useCreateCheckout';

interface SubscriptionGateProps {
  feature: string;
  description: string;
  icon: React.ReactNode;
}

export function SubscriptionGate({
  feature,
  description,
  icon,
}: SubscriptionGateProps) {
  const { hasAccess, isLoading } = useHasPremiumAccess();
  const createCheckout = useCreateCheckout();
  const navigate = useNavigate();
  const [isStartingTrial, setIsStartingTrial] = useState(false);

  const handleStartTrial = async () => {
    setIsStartingTrial(true);
    try {
      await createCheckout.mutateAsync();
    } catch (error) {
      console.error('Failed to start trial:', error);
    } finally {
      setIsStartingTrial(false);
    }
  };

  const handleViewSubscription = () => {
    navigate('/subscription');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (hasAccess) {
    return null; // Don't show gate if user has access
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-teal-50 rounded-lg border-2 border-dashed border-orange-300 p-8 text-center">
      <div className="mb-6">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-teal-500 text-white">
          {icon}
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-900">
          {feature} Requires Premium
        </h3>
        <p className="text-gray-600">{description}</p>
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Crown className="h-4 w-4 text-yellow-500" />
          <span>7-day free trial</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span>Unlimited AI recipe creation</span>
        </div>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
          <ChefHat className="h-4 w-4 text-orange-500" />
          <span>Multiple AI chef personas</span>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          onClick={handleStartTrial}
          disabled={isStartingTrial || createCheckout.isPending}
          className="w-full bg-gradient-to-r from-orange-500 to-teal-500 hover:from-orange-600 hover:to-teal-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          {isStartingTrial || createCheckout.isPending ? (
            <>
              <div className="loading loading-spinner loading-sm mr-2"></div>
              Starting Trial...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Start Free Trial & Save Recipe
            </>
          )}
        </Button>

        <Button
          variant="outline"
          onClick={handleViewSubscription}
          className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          View All Premium Features
        </Button>
      </div>
    </div>
  );
}
