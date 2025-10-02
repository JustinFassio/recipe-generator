import { calculateImageCost, getUserCostSummary, getCostAnalytics } from '@/lib/ai-image-generation/cost-tracker';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } } })),
    },
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { id: 'cost-123' }, error: null })),
        })),
      })),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          apply: vi.fn(() => Promise.resolve({ 
            data: [
              {
                id: '1',
                cost: 0.04,
                size: '1024x1024',
                quality: 'standard',
                success: true,
                created_at: new Date().toISOString(),
              },
              {
                id: '2',
                cost: 0.08,
                size: '1024x1024',
                quality: 'hd',
                success: true,
                created_at: new Date().toISOString(),
              },
            ],
            error: null 
          })),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ 
              data: [
                {
                  id: '1',
                  cost: 0.04,
                  size: '1024x1024',
                  quality: 'standard',
                  success: true,
                  created_at: new Date().toISOString(),
                  generation_time_ms: 2000,
                },
              ],
              error: null 
            })),
          })),
        })),
      })),
    })),
  },
}));

describe('Cost Tracker', () => {
  describe('calculateImageCost', () => {
    it('should calculate correct cost for standard quality square images', () => {
      const cost = calculateImageCost('1024x1024', 'standard');
      expect(cost).toBe(0.04);
    });

    it('should calculate correct cost for HD quality square images', () => {
      const cost = calculateImageCost('1024x1024', 'hd');
      expect(cost).toBe(0.08);
    });

    it('should calculate correct cost for portrait size images', () => {
      const standardCost = calculateImageCost('1024x1792', 'standard');
      const hdCost = calculateImageCost('1024x1792', 'hd');
      
      expect(standardCost).toBe(0.08);
      expect(hdCost).toBe(0.12);
    });

    it('should calculate correct cost for landscape size images', () => {
      const standardCost = calculateImageCost('1792x1024', 'standard');
      const hdCost = calculateImageCost('1792x1024', 'hd');
      
      expect(standardCost).toBe(0.08);
      expect(hdCost).toBe(0.12);
    });
  });

  describe('getUserCostSummary', () => {
    it('should return cost summary with correct calculations', async () => {
      const summary = await getUserCostSummary();

      expect(summary.total_cost).toBe(0.12);
      expect(summary.total_generations).toBe(2);
      expect(summary.successful_generations).toBe(2);
      expect(summary.failed_generations).toBe(0);
      expect(summary.average_cost_per_generation).toBe(0.06);
      expect(summary.cost_by_quality.standard).toBe(0.04);
      expect(summary.cost_by_quality.hd).toBe(0.08);
      expect(summary.cost_by_size['1024x1024']).toBe(0.12);
    });

    it('should handle different periods', async () => {
      const daySummary = await getUserCostSummary(undefined, 'day');
      const weekSummary = await getUserCostSummary(undefined, 'week');
      const monthSummary = await getUserCostSummary(undefined, 'month');

      expect(daySummary).toBeDefined();
      expect(weekSummary).toBeDefined();
      expect(monthSummary).toBeDefined();
    });
  });

  describe('getCostAnalytics', () => {
    it('should return analytics with correct calculations', async () => {
      const analytics = await getCostAnalytics();

      expect(analytics.user_id).toBe('test-user-id');
      expect(analytics.total_cost).toBe(0.04);
      expect(analytics.generation_count).toBe(1);
      expect(analytics.success_rate).toBe(1);
      expect(analytics.average_generation_time).toBe(2000);
      expect(analytics.cost_trend).toBe('stable');
      expect(analytics.most_used_quality).toBe('standard');
      expect(analytics.most_used_size).toBe('1024x1024');
    });

    it('should handle different periods', async () => {
      const dayAnalytics = await getCostAnalytics(undefined, 'day');
      const weekAnalytics = await getCostAnalytics(undefined, 'week');
      const monthAnalytics = await getCostAnalytics(undefined, 'month');
      const yearAnalytics = await getCostAnalytics(undefined, 'year');

      expect(dayAnalytics).toBeDefined();
      expect(weekAnalytics).toBeDefined();
      expect(monthAnalytics).toBeDefined();
      expect(yearAnalytics).toBeDefined();
    });
  });
});
