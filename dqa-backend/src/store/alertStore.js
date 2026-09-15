// Quality Alert Store and Spike Alert Threshold Monitoring Engine
const { shiftLogs } = require('./logStore');
const { STATIONS, TENANTS } = require('./assetStore');

const qualityAlerts = [];
const MAX_ALERTS = 500; // Prevent memory leak from unbounded alerts

/**
 * Checks if 3 consecutive inspections on the same station have status = FAIL
 * within a rolling 10-minute window (600,000 ms).
 */
const checkSpikeAlert = (station_id, tenant_id) => {
  if (!station_id) return null;

  // Get all logs for this station sorted newest first with deterministic tie-breaking
  const stationLogs = shiftLogs
    .filter(l => l.station_id === station_id)
    .sort((a, b) => {
      const timeDiff = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (timeDiff !== 0) return timeDiff;
      return (b.seq || 0) - (a.seq || 0);
    });

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

  // 3. Check if an active or acknowledged alert already exists for this station to avoid duplicate alert spam
  const existingActive = qualityAlerts.find(
    a => a.station_id === station_id && (a.status === 'Active' || a.status === 'Acknowledged')
  );
  if (existingActive) return existingActive;

  // 4. Check if these specific 3 failed logs have already been recorded in a prior alert
  const recent3Ids = recent3.map(l => l.id).sort().join(',');
  const alreadyAlerted = qualityAlerts.some(a => a.trigger_log_ids === recent3Ids);
  if (alreadyAlerted) return null;

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
    trigger_log_ids: recent3Ids,
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

  // Cap size to prevent memory leak
  if (qualityAlerts.length > MAX_ALERTS) {
    qualityAlerts.length = MAX_ALERTS;
  }

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
