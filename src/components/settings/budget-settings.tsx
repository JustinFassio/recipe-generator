import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  AlertTriangle, 
  Save,
  Info
} from 'lucide-react';
import { 
  getUserBudget, 
  updateUserBudget, 
  getBudgetStatus,
  checkAndCreateBudgetAlerts,
  type UserBudget,
  type BudgetStatus 
} from '@/lib/ai-image-generation/budget-manager';
import { toast } from '@/hooks/use-toast';

export function BudgetSettings() {
  const [budget, setBudget] = useState<UserBudget | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    monthly_limit: 10,
    daily_limit: 1,
    weekly_limit: 3,
    alert_threshold: 80,
    auto_pause_enabled: true,
    pause_at_limit: true,
  });

  useEffect(() => {
    loadBudgetData();
  }, []);

  const loadBudgetData = async () => {
    try {
      setIsLoading(true);
      const [budgetData, status] = await Promise.all([
        getUserBudget(),
        getBudgetStatus(),
      ]);

      setBudget(budgetData);
      setBudgetStatus(status);
      
      setFormData({
        monthly_limit: budgetData.monthly_limit,
        daily_limit: budgetData.daily_limit,
        weekly_limit: budgetData.weekly_limit,
        alert_threshold: budgetData.alert_threshold,
        auto_pause_enabled: budgetData.auto_pause_enabled,
        pause_at_limit: budgetData.pause_at_limit,
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
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!budget) return;

    try {
      setIsSaving(true);
      await updateUserBudget(formData);
      await checkAndCreateBudgetAlerts();
      
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

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;

  // Removed unused getStatusColor function

  const getStatusBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge variant="destructive">Critical</Badge>;
    if (percentage >= 75) return <Badge variant="secondary">Warning</Badge>;
    return <Badge variant="default">Good</Badge>;
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
            <div className="text-sm text-gray-500">Loading budget settings...</div>
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
            Configure your spending limits and budget controls for AI image generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          {budgetStatus && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-gray-50">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(budgetStatus.daily.remaining)}
                </div>
                <div className="text-sm text-gray-600">Daily Remaining</div>
                {getStatusBadge(budgetStatus.daily.percentage)}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(budgetStatus.weekly.remaining)}
                </div>
                <div className="text-sm text-gray-600">Weekly Remaining</div>
                {getStatusBadge(budgetStatus.weekly.percentage)}
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatCurrency(budgetStatus.monthly.remaining)}
                </div>
                <div className="text-sm text-gray-600">Monthly Remaining</div>
                {getStatusBadge(budgetStatus.monthly.percentage)}
              </div>
            </div>
          )}

          {/* Budget Limits */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Budget Limits</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="daily_limit">Daily Limit</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="daily_limit"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.daily_limit}
                    onChange={(e) => handleInputChange('daily_limit', parseFloat(e.target.value) || 0)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Maximum daily spending on image generation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="weekly_limit">Weekly Limit</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="weekly_limit"
                    type="number"
                    min="0"
                    max="500"
                    step="0.01"
                    value={formData.weekly_limit}
                    onChange={(e) => handleInputChange('weekly_limit', parseFloat(e.target.value) || 0)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Maximum weekly spending on image generation
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="monthly_limit">Monthly Limit</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="monthly_limit"
                    type="number"
                    min="0"
                    max="2000"
                    step="0.01"
                    value={formData.monthly_limit}
                    onChange={(e) => handleInputChange('monthly_limit', parseFloat(e.target.value) || 0)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-gray-600">
                  Maximum monthly spending on image generation
                </p>
              </div>
            </div>
          </div>

          {/* Alert Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Alert Settings</h3>
            
            <div className="space-y-2">
              <Label htmlFor="alert_threshold">Alert Threshold (%)</Label>
              <Input
                id="alert_threshold"
                type="number"
                min="10"
                max="99"
                value={formData.alert_threshold}
                onChange={(e) => handleInputChange('alert_threshold', parseInt(e.target.value) || 80)}
              />
              <p className="text-xs text-gray-600">
                Get notified when you reach this percentage of your budget limit
              </p>
            </div>
          </div>

          {/* Safety Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Safety Controls</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto_pause">Auto-Pause Generation</Label>
                  <p className="text-sm text-gray-600">
                    Automatically pause image generation when budget limits are reached
                  </p>
                </div>
                <Switch
                  id="auto_pause"
                  checked={formData.auto_pause_enabled}
                  onCheckedChange={(checked) => handleInputChange('auto_pause_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pause_at_limit">Pause at Limit</Label>
                  <p className="text-sm text-gray-600">
                    Immediately stop generation when any budget limit is reached
                  </p>
                </div>
                <Switch
                  id="pause_at_limit"
                  checked={formData.pause_at_limit}
                  onCheckedChange={(checked) => handleInputChange('pause_at_limit', checked)}
                />
              </div>
            </div>
          </div>

          {/* Cost Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Cost Reference:</strong> Standard quality images cost $0.04-$0.08 each, 
              HD quality costs $0.08-$0.12 each. Square (1024x1024) size is most cost-effective.
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
      {budgetStatus && budgetStatus.is_paused && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Generation Paused:</strong> Image generation is currently paused due to budget limits. 
            Adjust your budget settings or wait for the next reset period to continue generating images.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
