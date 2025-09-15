#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const monitoringConfig = {
  alerts: {
    errorRate: { threshold: 1.0, window: '5m', severity: 'high' },
    responseTime: { threshold: 2000, window: '5m', severity: 'medium' },
    uptime: { threshold: 99.0, window: '1h', severity: 'critical' },
  },
  endpoints: { healthCheck: '/api/health', metrics: '/api/metrics' },
  notifications: {
    email: process.env.ALERT_EMAIL || '',
    webhook: process.env.ALERT_WEBHOOK || '',
  },
};

const output = path.join(__dirname, '../monitoring.json');
fs.writeFileSync(output, JSON.stringify(monitoringConfig, null, 2));
console.log('✅ Monitoring configuration created at', output);
