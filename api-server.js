import express from 'express';
const app = express();
const port = 3000;

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
  });
});

// Recipe standardize endpoint
app.post('/api/recipe-standardize', express.json(), (req, res) => {
  const { recipeText } = req.body;
  
  if (!recipeText) {
    return res.status(400).json({ error: 'recipeText is required' });
  }
  
  // Simple response for now
  res.json({
    standardized: recipeText,
    message: 'Recipe standardized successfully'
  });
});

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
