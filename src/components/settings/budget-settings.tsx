import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// TODO: If the Badge component is needed in the future (e.g., for budget status indicators), uncomment this import
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, AlertTriangle, Save, Info } from 'lucide-react';
import {
  getUserBudget,
  type UserBudget,
} from '@/lib/ai-image-generation/budget-manager';
import { BUDGET_CONFIG, formatCurrency } from '@/config/budget';
import { toast } from '@/hooks/use-toast';

export function BudgetSettings() {
  const { user } = useAuth();
  const [budget, setBudget] = useState<UserBudget | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<UserBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state - Only include working features
  const [formData, setFormData] = useState<{
    monthly_limit: number;
  }>({
    monthly_limit: BUDGET_CONFIG.DEFAULT_MONTHLY_BUDGET,
  });

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setIsLoading(true);
      const budgetData = await getUserBudget();

      setBudget(budgetData);
      setBudgetStatus(budgetData);

      setFormData({
        monthly_limit: budgetData.monthly_budget,
      });
    } catch (error) {
      console.error('Failed to load budget data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load budget settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!budget) return;

    try {
      setIsSaving(true);
      // Update budget with simplified interface
      const { error } = await supabase
        .from('user_budgets')
        .update({
          monthly_budget: formData.monthly_limit,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setHasChanges(false);
      await loadBudgetData(); // Reload to get updated status

      toast({
        title: 'Budget Settings Saved',
        description: 'Your budget preferences have been updated successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to save budget settings:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save budget settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Budget Settings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500">
              Loading budget settings...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Budget Settings</span>
          </CardTitle>
          <CardDescription>
            Configure your spending limits and budget controls for AI image
            generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          {budgetStatus && (
            <div className="grid grid-cols-1 gap-4 p-4 rounded-lg bg-gray-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(
                    budgetStatus.monthly_budget - budgetStatus.used_monthly
                  )}
                </div>
                <div className="text-sm text-gray-600">Monthly Remaining</div>
                <div className="text-xs text-gray-500">
                  {formatCurrency(budgetStatus.used_monthly)} of{' '}
                  {formatCurrency(budgetStatus.monthly_budget)} used
                </div>
              </div>
            </div>
          )}

          {/* Monthly Budget Limit */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Monthly Budget Limit</h3>

            <div className="space-y-2">
              <Label htmlFor="monthly_limit">Monthly Limit</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="monthly_limit"
                  type="number"
                  min={BUDGET_CONFIG.MIN_MONTHLY_BUDGET}
                  max={BUDGET_CONFIG.MAX_MONTHLY_BUDGET}
                  step="0.01"
                  value={formData.monthly_limit}
                  onChange={(e) =>
                    handleInputChange(
                      'monthly_limit',
                      parseFloat(e.target.value) ||
                        BUDGET_CONFIG.MIN_MONTHLY_BUDGET
                    )
                  }
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-gray-600">
                Maximum monthly spending on AI image generation
              </p>
            </div>
          </div>

          {/* Feature Status */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Features:</strong> Only monthly budget limits are
              currently supported. Daily/weekly limits, alerts, and auto-pause
              features are planned for future releases.
            </AlertDescription>
          </Alert>

          {/* Cost Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Cost Reference:</strong> Standard quality images cost
              $0.04-$0.08 each, HD quality costs $0.08-$0.12 each. Square
              (1024x1024) size is most cost-effective.
            </AlertDescription>
          </Alert>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className="min-w-[120px]"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Budget Status Alert */}
      {budgetStatus &&
        budgetStatus.used_monthly >= budgetStatus.monthly_budget && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Budget Exceeded:</strong> You have reached your monthly
              budget limit. Consider increasing your monthly budget to continue
              generating images.
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
