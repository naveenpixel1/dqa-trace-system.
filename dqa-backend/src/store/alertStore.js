// Quality Alert Store and Spike Alert Threshold Monitoring Engine
const { shiftLogs } = require('./logStore');
const { STATIONS, TENANTS } = require('./assetStore');

const qualityAlerts = [];

/**
 * Checks if 3 consecutive inspections on the same station have status = FAIL
 * within a rolling 10-minute window (600,000 ms).
 */
const checkSpikeAlert = (station_id, tenant_id) => {
  if (!station_id) return null;

  // Get all logs for this station sorted newest first
  const stationLogs = shiftLogs
    .filter(l => l.station_id === station_id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (stationLogs.length < 3) return null;

  // Take the last 3 inspection entries
  const recent3 = stationLogs.slice(0, 3);

  // 1. Verify all 3 have status = FAIL
  const allFail = recent3.every(l => l.status === 'FAIL');
  if (!allFail) return null;

  // 2. Verify time difference between newest and oldest of the 3 is <= 10 minutes (600,000ms)
  const newestTime = new Date(recent3[0].created_at).getTime();
  const oldestTime = new Date(recent3[2].created_at).getTime();
  const diffMs = newestTime - oldestTime;

  if (diffMs > 10 * 60 * 1000) return null;

  // 3. Check if an active alert already exists for this station to avoid duplicates
  const existingActive = qualityAlerts.find(
    a => a.station_id === station_id && a.status === 'Active'
  );
  if (existingActive) return existingActive;

  // Resolve station name and tenant name
  const stationObj = STATIONS.find(s => s.id === station_id || s.code === station_id);
  const tenantObj = TENANTS.find(t => t.id === tenant_id || t.code === tenant_id);

  const stationName = stationObj ? stationObj.name : station_id;
  const tenantName = tenantObj ? tenantObj.name : tenant_id;

  // Gather defects observed in the 3 failed logs
  const recentDefects = Array.from(
    new Set(recent3.flatMap(l => l.defects || []))
  );

  const newAlert = {
    id: `ALT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    station_id,
    station_name: stationName,
    tenant_id,
    tenant_name: tenantName,
    trigger_time: new Date().toISOString(),
    consecutive_fail_count: 3,
    time_window_minutes: Number((diffMs / 60000).toFixed(1)),
    recent_defects: recentDefects.length > 0 ? recentDefects : ['Quality Failure'],
    severity: 'High',
    status: 'Active', // 'Active', 'Acknowledged', 'Resolved'
    acknowledged_by: null,
    acknowledged_at: null,
    resolution_notes: null,
    resolved_at: null
  };

  qualityAlerts.unshift(newAlert);
  console.log(`🚨 ALERT TRIGGERED: 3 consecutive FAILs on station ${stationName} within ${newAlert.time_window_minutes} mins!`);
  return newAlert;
};

const getAlerts = (filters = {}) => {
  let filtered = qualityAlerts;
  if (filters.status) {
    filtered = filtered.filter(a => a.status.toLowerCase() === filters.status.toLowerCase());
  }
  if (filters.station_id) {
    filtered = filtered.filter(a => a.station_id === filters.station_id);
  }
  return filtered;
};

const acknowledgeAlert = (alertId, user = 'Supervisor') => {
  const alert = qualityAlerts.find(a => a.id === alertId);
  if (!alert) return null;

  alert.status = 'Acknowledged';
  alert.acknowledged_by = user;
  alert.acknowledged_at = new Date().toISOString();
  return alert;
};

const resolveAlert = (alertId, notes = '') => {
  const alert = qualityAlerts.find(a => a.id === alertId);
  if (!alert) return null;

  alert.status = 'Resolved';
  alert.resolution_notes = notes || 'Station recalibrated and quality verified.';
  alert.resolved_at = new Date().toISOString();
  return alert;
};

module.exports = {
  qualityAlerts,
  checkSpikeAlert,
  getAlerts,
  acknowledgeAlert,
  resolveAlert
};
