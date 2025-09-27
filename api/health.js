module.exports = (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    };
    return res.status(200).json(payload);
  } catch {
    return res.status(500).json({ status: 'unhealthy' });
  }
};
