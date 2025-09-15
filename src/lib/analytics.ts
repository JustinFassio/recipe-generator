import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';

type VitalRating = 'good' | 'needs-improvement' | 'poor';
type WebVitalMetric = Metric & { rating: VitalRating };

function sendToAnalytics(metric: WebVitalMetric): void {
  if (typeof window !== 'undefined') {
    const va = (
      window as Window & {
        va?: (
          event: 'beforeSend' | 'event' | 'pageview',
          properties?: unknown
        ) => void;
      }
    ).va;
    va?.('event', {
      name: 'web-vital',
      data: {
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
      },
    });
  }

  if (import.meta.env.DEV) {
    console.log(`Web Vital - ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
    });
  }
}

export function initWebVitals(): void {
  onCLS(sendToAnalytics);
  onINP(sendToAnalytics);
  onFCP(sendToAnalytics);
  onLCP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}
