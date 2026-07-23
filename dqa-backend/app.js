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

app.use(cors());
app.use(express.json());

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

app.listen(PORT, () => {
  console.log(`Server is running successfully on port ${PORT}`);
});