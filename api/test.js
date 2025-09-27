module.exports = (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    message: 'API server is working',
    timestamp: new Date().toISOString()
  });
};
