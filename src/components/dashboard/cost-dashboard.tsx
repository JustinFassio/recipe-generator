import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  PieChart,
  BarChart3,
  Settings
} from 'lucide-react';
import { 
  getUserCostSummary, 
  getCostAnalytics, 
  getCostOptimizationSuggestions,
  type UserCostSummary,
  type CostAnalytics 
} from '@/lib/ai-image-generation/cost-tracker';
import { getBudgetStatus, type BudgetStatus } from '@/lib/ai-image-generation/budget-manager';
// Removed unused OptimizationRecommendation import
import { toast } from '@/hooks/use-toast';

export function CostDashboard() {
  const [costSummary, setCostSummary] = useState<UserCostSummary | null>(null);
  const [costAnalytics, setCostAnalytics] = useState<CostAnalytics | null>(null);
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatus | null>(null);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month'>('month');

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [summary, analytics, status, suggestions] = await Promise.all([
        getUserCostSummary(undefined, selectedPeriod),
        getCostAnalytics(undefined, selectedPeriod),
        getBudgetStatus(),
        getCostOptimizationSuggestions(),
      ]);

      setCostSummary(summary);
      setCostAnalytics(analytics);
      setBudgetStatus(status);
      setOptimizationSuggestions(suggestions);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load cost dashboard data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => `$${amount.toFixed(2)}`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  // Removed unused getBudgetStatusColor function

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Cost Dashboard</h2>
        <div className="flex space-x-2">
          {(['day', 'week', 'month'] as const).map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(costSummary?.total_cost || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {costSummary?.total_generations || 0} generations
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatPercentage(costAnalytics?.success_rate || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {costSummary?.successful_generations || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costSummary?.average_cost_per_generation || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              per generation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Trend</CardTitle>
            {costAnalytics && getTrendIcon(costAnalytics.cost_trend)}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {costAnalytics?.cost_trend || 'stable'}
            </div>
            <p className="text-xs text-muted-foreground">
              vs previous period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Status */}
      {budgetStatus && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Daily Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Used</span>
                <span className="text-sm font-medium">
                  {formatCurrency(budgetStatus.daily.used)} / {formatCurrency(budgetStatus.daily.limit)}
                </span>
              </div>
              <Progress 
                value={budgetStatus.daily.percentage} 
                className="h-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatPercentage(budgetStatus.daily.percentage)}
                </span>
                <Badge 
                  variant={budgetStatus.daily.percentage >= 90 ? 'destructive' : 'default'}
                >
                  {budgetStatus.daily.remaining > 0 ? formatCurrency(budgetStatus.daily.remaining) : 'Limit reached'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Weekly Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Used</span>
                <span className="text-sm font-medium">
                  {formatCurrency(budgetStatus.weekly.used)} / {formatCurrency(budgetStatus.weekly.limit)}
                </span>
              </div>
              <Progress 
                value={budgetStatus.weekly.percentage} 
                className="h-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatPercentage(budgetStatus.weekly.percentage)}
                </span>
                <Badge 
                  variant={budgetStatus.weekly.percentage >= 90 ? 'destructive' : 'default'}
                >
                  {budgetStatus.weekly.remaining > 0 ? formatCurrency(budgetStatus.weekly.remaining) : 'Limit reached'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Budget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Used</span>
                <span className="text-sm font-medium">
                  {formatCurrency(budgetStatus.monthly.used)} / {formatCurrency(budgetStatus.monthly.limit)}
                </span>
              </div>
              <Progress 
                value={budgetStatus.monthly.percentage} 
                className="h-2"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {formatPercentage(budgetStatus.monthly.percentage)}
                </span>
                <Badge 
                  variant={budgetStatus.monthly.percentage >= 90 ? 'destructive' : 'default'}
                >
                  {budgetStatus.monthly.remaining > 0 ? formatCurrency(budgetStatus.monthly.remaining) : 'Limit reached'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Usage Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usage Analytics</CardTitle>
            <CardDescription>
              Detailed usage statistics for {selectedPeriod}ly period
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {costAnalytics && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Peak Usage Hour</span>
                  <Badge variant="outline">
                    {costAnalytics.peak_usage_hour}:00
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Most Used Quality</span>
                  <Badge variant="outline">
                    {costAnalytics.most_used_quality.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Most Used Size</span>
                  <Badge variant="outline">
                    {costAnalytics.most_used_size}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Generation Time</span>
                  <Badge variant="outline">
                    {Math.round(costAnalytics.average_generation_time / 1000)}s
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Breakdown</CardTitle>
            <CardDescription>
              Cost distribution by quality and size
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {costSummary && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">By Quality</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Standard</span>
                      <span className="text-xs font-medium">
                        {formatCurrency(costSummary.cost_by_quality.standard)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">HD</span>
                      <span className="text-xs font-medium">
                        {formatCurrency(costSummary.cost_by_quality.hd)}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">By Size</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Square (1024x1024)</span>
                      <span className="text-xs font-medium">
                        {formatCurrency(costSummary.cost_by_size['1024x1024'])}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Portrait (1024x1792)</span>
                      <span className="text-xs font-medium">
                        {formatCurrency(costSummary.cost_by_size['1024x1792'])}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs">Landscape (1792x1024)</span>
                      <span className="text-xs font-medium">
                        {formatCurrency(costSummary.cost_by_size['1792x1024'])}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      {optimizationSuggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Cost Optimization Suggestions
            </CardTitle>
            <CardDescription>
              Recommendations to reduce your image generation costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {optimizationSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Status Alert */}
      {budgetStatus && budgetStatus.is_paused && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-lg text-red-800 flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Budget Limit Reached
            </CardTitle>
            <CardDescription className="text-red-700">
              Image generation is currently paused due to budget limits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
              <Settings className="h-4 w-4 mr-2" />
              Adjust Budget Settings
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
