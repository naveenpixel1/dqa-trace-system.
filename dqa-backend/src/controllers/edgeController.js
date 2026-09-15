const { edgeDevices, edgeTelemetryLogs, logEdgeEvent } = require('../store/deviceStore');
const { addLog } = require('../store/logStore');
const { checkSpikeAlert } = require('../store/alertStore');

const EDGE_API_KEY = process.env.EDGE_API_KEY || 'dqa-edge-secret-2026';

const processEdgeSensorData = async (req, res) => {
  try {
    const authKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    // Validate API Key for secure IoT device ingestion
    if (!authKey || authKey !== EDGE_API_KEY) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized Edge Device. Invalid or missing x-api-key header.'
      });
    }

    const { 
      deviceId, 
      stationId, 
      tenantId, 
      sensorType = 'inspection_trigger', 
      status = 'PASS', 
      barcode = '', 
      defects = [], 
      notes = '' 
    } = req.body;

    if (!deviceId || !stationId || !tenantId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required payload parameters: deviceId, stationId, and tenantId are required.'
      });
    }

    // Log telemetry event
    const telemetry = logEdgeEvent({
      deviceId,
      stationId,
      tenantId,
      sensorType,
      status,
      barcode,
      defects,
      notes
    });

    // Automatically create production inspection log entry
    const inspectionLog = addLog({
      tenant_id: tenantId,
      station_id: stationId,
      shift: 'Shift A (06:00 - 14:00)',
      operator_name: `IoT Device (${deviceId})`,
      status,
      serial_number: barcode || `IOT-UNIT-${Math.floor(Math.random() * 10000)}`,
      defects: Array.isArray(defects) ? defects : [defects].filter(Boolean),
      notes: notes || `Auto-ingested via IoT ${sensorType} signal`
    });

    // Automatically evaluate 3-consecutive-FAIL spike alert threshold
    const triggeredAlert = checkSpikeAlert(stationId, tenantId);

    return res.status(201).json({
      success: true,
      data: {
        telemetry,
        inspectionLog,
        triggeredAlert: triggeredAlert || null
      },
      error: null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Edge sensor processing failed'
    });
  }
};

const getEdgeDevices = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        devices: edgeDevices,
        recentTelemetry: edgeTelemetryLogs.slice(0, 15)
      },
      error: null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Failed to fetch edge devices'
    });
  }
};

const simulateSensorEvent = async (req, res) => {
  try {
    const { deviceId = 'ESP32-001', status = 'PASS', barcode, defects } = req.body;
    const deviceObj = edgeDevices.find(d => d.deviceId === deviceId) || edgeDevices[0];

    // Mock API call to processEdgeSensorData internally
    req.headers['x-api-key'] = EDGE_API_KEY;
    req.body = {
      deviceId: deviceObj.deviceId,
      stationId: deviceObj.assignedStation,
      tenantId: deviceObj.assignedTenant,
      sensorType: 'simulated_hardware_trigger',
      status,
      barcode: barcode || `LOT-SIM-${Date.now().toString().slice(-6)}`,
      defects: defects || (status === 'FAIL' ? ['Dimension Out-of-Spec'] : []),
      notes: `Simulated trigger via Hardware Console`
    };

    return processEdgeSensorData(req, res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Simulation failed'
    });
  }
};

module.exports = {
  processEdgeSensorData,
  getEdgeDevices,
  simulateSensorEvent
};
