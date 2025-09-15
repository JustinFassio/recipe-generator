import { useEffect, useState } from 'react';

type SystemMetrics = {
  uptime: number;
  errorRate: number;
  avgResponseTime: number;
  totalRequests: number;
  lastError?: { message: string; timestamp: string };
};

export function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      // Placeholder for future server metrics
      const mock: SystemMetrics = {
        uptime: 99.9,
        errorRate: 0.02,
        avgResponseTime: 240,
        totalRequests: 15420,
      };
      setMetrics(mock);
      setLoading(false);
    };
    fetchMetrics();
    const id = setInterval(fetchMetrics, 30000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-base-300 rounded w-1/4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-base-300 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const getUptimeColor = (uptime: number) => {
    if (uptime >= 99.9) return 'text-success';
    if (uptime >= 99.0) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">System Health</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div
              className={`text-2xl font-bold ${getUptimeColor(metrics.uptime)}`}
            >
              {metrics.uptime}%
            </div>
            <div className="text-sm">Uptime</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="text-2xl font-bold text-error">
              {metrics.errorRate}%
            </div>
            <div className="text-sm">Error Rate</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="text-2xl font-bold text-info">
              {metrics.avgResponseTime}ms
            </div>
            <div className="text-sm">Avg Response</div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="text-2xl font-bold text-primary">
              {metrics.totalRequests.toLocaleString()}
            </div>
            <div className="text-sm">Total Requests</div>
          </div>
        </div>
      </div>
    </div>
  );
}
