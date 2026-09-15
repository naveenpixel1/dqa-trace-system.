const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { validateLogInput } = require('./src/middleware/validate');
const { createProductionLog } = require('./src/controllers/logController');
const { getShiftStats } = require('./src/controllers/metricsController');
const { getTenants, getStations, getDefectCategories } = require('./src/controllers/assetController');
const { 
  getParetoAnalytics, 
  getQualityAlerts, 
  handleAcknowledgeAlert, 
  handleResolveAlert 
} = require('./src/controllers/analyticsController');
const { 
  processEdgeSensorData, 
  getEdgeDevices, 
  simulateSensorEvent 
} = require('./src/controllers/edgeController');

const app = express();
const PORT = process.env.PORT || 5000;

// Production CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (IoT devices, curl, server-to-server) without Origin header
    if (!origin) return callback(null, true);
    
    // Explicit origin check
    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow Vercel preview & production deployments (*.vercel.app)
    try {
      const parsedUrl = new URL(origin);
      if (parsedUrl.hostname.endsWith('.vercel.app')) {
        return callback(null, true);
      }
    } catch (_) {}

    return callback(new Error(`CORS policy violation: Origin '${origin}' is not authorized.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'X-Requested-With'],
  exposedHeaders: ['x-api-key']
}));

// Body parser with size boundary to prevent denial-of-service memory pressure
app.use(express.json({ limit: '1mb' }));

// Status health route
app.get('/status', (req, res) => {
  res.json({ status: 'Online', message: 'DQA-Trace API is functioning correctly' });
});

// Dynamic Asset & Taxonomy endpoints
app.get('/api/tenants', getTenants);
app.get('/api/stations', getStations);
app.get('/api/defects/categories', getDefectCategories);

// Production log and analytics endpoints
app.post('/api/logs', validateLogInput, createProductionLog);
app.get('/api/logs/stats', getShiftStats);

// Real-Time Pareto Analytics & Quality Alerts endpoints
app.get('/api/analytics/pareto', getParetoAnalytics);
app.get('/api/alerts', getQualityAlerts);
app.post('/api/alerts/:id/acknowledge', handleAcknowledgeAlert);
app.post('/api/alerts/:id/resolve', handleResolveAlert);

// Industry 4.0 Edge Hardware & IoT Readiness endpoints
app.post('/api/v1/edge-sensor', processEdgeSensorData);
app.get('/api/v1/edge-devices', getEdgeDevices);
app.post('/api/v1/edge-simulator/trigger', simulateSensorEvent);

// Centralized JSON 404 Handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint '${req.method} ${req.originalUrl}' not found.`,
    timestamp: new Date().toISOString()
  });
});

// Centralized Express 5 Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled API Error:', err);

  // Catch invalid JSON syntax from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload in request body.',
      timestamp: new Date().toISOString()
    });
  }

  // Catch CORS errors
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error occurred.' : (err.message || 'Internal server error'),
    timestamp: new Date().toISOString()
  });
});

// Start HTTP server only in standalone / local mode (Vercel invokes the handler directly)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running successfully on port ${PORT}`);
  });
}

module.exports = app;