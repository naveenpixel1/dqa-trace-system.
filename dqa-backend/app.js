const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { validateLogInput } = require('./src/middleware/validate');
const { createProductionLog } = require('./src/controllers/logController');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// A simple test route to check if our backend is breathing
app.get('/status', (req, res) => {
  res.json({ status: 'Online', message: 'DQA-Trace API is functioning correctly' });
});

// The main production endpoint that protects data and saves it
app.post('/api/logs', validateLogInput, createProductionLog);

app.listen(PORT, () => {
  console.log(`Server is running successfully on port ${PORT}`);
});