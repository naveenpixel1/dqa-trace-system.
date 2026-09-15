// Registry of connected IoT Edge devices and sensor telemetry logs
const { STATIONS, TENANTS } = require('./assetStore');

const edgeDevices = [
  {
    deviceId: 'ESP32-001',
    deviceName: 'ESP32 Microcontroller Bench #1',
    deviceType: 'ESP32',
    assignedStation: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
    assignedTenant: '550e8400-e29b-41d4-a716-446655440000',
    firmwareVersion: 'v2.4.1-ota',
    ipAddress: '192.168.1.104',
    status: 'Online',
    lastHeartbeat: new Date().toISOString()
  },
  {
    deviceId: 'PLC-SIEMENS-02',
    deviceName: 'Siemens S7 Industrial PLC Line A',
    deviceType: 'PLC',
    assignedStation: 'd4e5f6a7-b89c-0d1e-2f3a-4b5c6d7e8f9a',
    assignedTenant: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    firmwareVersion: 'v4.0.2',
    ipAddress: '192.168.1.120',
    status: 'Online',
    lastHeartbeat: new Date().toISOString()
  },
  {
    deviceId: 'SCANNER-COGNEX-03',
    deviceName: 'Cognex Fixed Optical QR Reader',
    deviceType: 'Scanner',
    assignedStation: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e',
    assignedTenant: '550e8400-e29b-41d4-a716-446655440000',
    firmwareVersion: 'v3.1.9',
    ipAddress: '192.168.1.135',
    status: 'Online',
    lastHeartbeat: new Date().toISOString()
  },
  {
    deviceId: 'SENSOR-LASER-04',
    deviceName: 'Laser Thickness Sensor Array',
    deviceType: 'Sensor',
    assignedStation: 'f6a7b89c-0d1e-2f3a-4b5c-6d7e8f9a0b1c',
    assignedTenant: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    firmwareVersion: 'v1.8.0',
    ipAddress: '192.168.1.142',
    status: 'Standby',
    lastHeartbeat: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  }
];

const edgeTelemetryLogs = [];
const MAX_TELEMETRY = 1000;

const logEdgeEvent = (eventData) => {
  const record = {
    id: `EDGE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    ...eventData,
    receivedAt: new Date().toISOString()
  };
  
  edgeTelemetryLogs.unshift(record);
  if (edgeTelemetryLogs.length > MAX_TELEMETRY) {
    edgeTelemetryLogs.length = MAX_TELEMETRY;
  }

  // Update heartbeat in device registry
  const dev = edgeDevices.find(d => d.deviceId === eventData.deviceId);
  if (dev) {
    dev.lastHeartbeat = new Date().toISOString();
    dev.status = 'Online';
  }

  return record;
};

module.exports = {
  edgeDevices,
  edgeTelemetryLogs,
  logEdgeEvent
};
