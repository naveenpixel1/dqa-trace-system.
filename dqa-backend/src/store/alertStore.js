// Quality Alert Store and Spike Alert Threshold Monitoring Engine
// Designed for serverless stateless execution (Supabase persistence) with in-memory fallback
const { supabase } = require('../config/supabase');
const { getStationLogs } = require('./logStore');
const { STATIONS, TENANTS } = require('./assetStore');

const qualityAlerts = [];
const MAX_ALERTS = 500; // Prevent memory leak on in-memory fallback

/**
 * Checks if 3 consecutive inspections on the same station have status = FAIL
 * within a rolling 10-minute window (600,000 ms).
 * Queries Supabase (or fallback in-memory buffer) so it functions seamlessly in serverless.
 */
const checkSpikeAlert = async (station_id, tenant_id) => {
  if (!station_id) return null;

  // 1. Fetch latest station logs (persisted across serverless functions via Supabase)
  const stationLogs = await getStationLogs(station_id, 10);

  if (!stationLogs || stationLogs.length < 3) return null;

  // 2. Take the last 3 inspection entries
  const recent3 = stationLogs.slice(0, 3);

  // 3. Verify all 3 have status = FAIL
  const allFail = recent3.every(l => l.status === 'FAIL');
  if (!allFail) return null;

  // 4. Verify time difference between newest and oldest of the 3 is <= 10 minutes (600,000ms)
  const newestTime = new Date(recent3[0].created_at).getTime();
  const oldestTime = new Date(recent3[2].created_at).getTime();
  const diffMs = newestTime - oldestTime;

  if (diffMs > 10 * 60 * 1000) return null;

  const recent3Ids = recent3.map(l => l.id).sort().join(',');

  // 5. Check if an active or acknowledged alert already exists for this station or these logs
  // Try querying Supabase first
  if (supabase) {
    try {
      // Check active or acknowledged alerts for this station
      const { data: existingActive } = await supabase
        .from('quality_alerts')
        .select('*')
        .eq('station_id', station_id)
        .in('status', ['Active', 'Acknowledged'])
        .limit(1);

      if (existingActive && existingActive.length > 0) {
        return existingActive[0];
      }

      // Check if these exact 3 failed logs have already been alerted on
      const { data: alreadyAlerted } = await supabase
        .from('quality_alerts')
        .select('*')
        .eq('trigger_log_ids', recent3Ids)
        .limit(1);

      if (alreadyAlerted && alreadyAlerted.length > 0) {
        return null;
      }
    } catch (dbErr) {
      console.warn('⚠️ Supabase alert duplicate check warning (using in-memory fallback):', dbErr.message);
    }
  }

  // In-memory fallback check
  const existingActiveLocal = qualityAlerts.find(
    a => a.station_id === station_id && (a.status === 'Active' || a.status === 'Acknowledged')
  );
  if (existingActiveLocal) return existingActiveLocal;

  const alreadyAlertedLocal = qualityAlerts.some(a => a.trigger_log_ids === recent3Ids);
  if (alreadyAlertedLocal) return null;

  // Resolve station name and tenant name
  const stationObj = STATIONS.find(s => s.id === station_id || s.code === station_id);
  const tenantObj = TENANTS.find(t => t.id === tenant_id || t.code === tenant_id);

  const stationName = stationObj ? stationObj.name : station_id;
  const tenantName = tenantObj ? tenantObj.name : tenant_id;

  // Gather defects observed in the 3 failed logs
  const recentDefects = Array.from(
    new Set(recent3.flatMap(l => (Array.isArray(l.defects) ? l.defects : [])))
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
    resolved_at: null,
    created_at: new Date().toISOString()
  };

  // Always keep in local memory
  qualityAlerts.unshift(newAlert);
  if (qualityAlerts.length > MAX_ALERTS) {
    qualityAlerts.length = MAX_ALERTS;
  }

  // Persist to Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('quality_alerts')
        .insert([newAlert])
        .select();

      if (!error && data && data.length > 0) {
        console.log(`🚨 ALERT TRIGGERED & PERSISTED (DB): 3 consecutive FAILs on station ${stationName}!`);
        return data[0];
      }
    } catch (dbErr) {
      console.warn('⚠️ Supabase quality_alerts insert warning (persisted locally):', dbErr.message);
    }
  }

  console.log(`🚨 ALERT TRIGGERED (Local): 3 consecutive FAILs on station ${stationName}!`);
  return newAlert;
};

const getAlerts = async (filters = {}) => {
  if (supabase) {
    try {
      let query = supabase
        .from('quality_alerts')
        .select('*')
        .order('trigger_time', { ascending: false });

      if (filters.status) {
        query = query.ilike('status', filters.status);
      }
      if (filters.station_id) {
        query = query.eq('station_id', filters.station_id);
      }

      const { data, error } = await query;
      if (!error && data) {
        return data;
      }
    } catch (dbErr) {
      console.warn('⚠️ Supabase getAlerts query warning (using in-memory fallback):', dbErr.message);
    }
  }

  // Fallback to in-memory store
  let filtered = qualityAlerts;
  if (filters.status) {
    filtered = filtered.filter(a => a.status.toLowerCase() === filters.status.toLowerCase());
  }
  if (filters.station_id) {
    filtered = filtered.filter(a => a.station_id === filters.station_id);
  }
  return filtered;
};

const acknowledgeAlert = async (alertId, user = 'Supervisor') => {
  const now = new Date().toISOString();

  // Try updating in Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('quality_alerts')
        .update({
          status: 'Acknowledged',
          acknowledged_by: user,
          acknowledged_at: now
        })
        .eq('id', alertId)
        .select();

      if (!error && data && data.length > 0) {
        // Also update local copy if present
        const local = qualityAlerts.find(a => a.id === alertId);
        if (local) {
          local.status = 'Acknowledged';
          local.acknowledged_by = user;
          local.acknowledged_at = now;
        }
        return data[0];
      }
    } catch (dbErr) {
      console.warn('⚠️ Supabase acknowledgeAlert warning (using local store):', dbErr.message);
    }
  }

  // Fallback to in-memory update
  const alert = qualityAlerts.find(a => a.id === alertId);
  if (!alert) return null;

  alert.status = 'Acknowledged';
  alert.acknowledged_by = user;
  alert.acknowledged_at = now;
  return alert;
};

const resolveAlert = async (alertId, notes = '') => {
  const now = new Date().toISOString();
  const resolution = notes || 'Station recalibrated and quality verified.';

  // Try updating in Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('quality_alerts')
        .update({
          status: 'Resolved',
          resolution_notes: resolution,
          resolved_at: now
        })
        .eq('id', alertId)
        .select();

      if (!error && data && data.length > 0) {
        // Also update local copy if present
        const local = qualityAlerts.find(a => a.id === alertId);
        if (local) {
          local.status = 'Resolved';
          local.resolution_notes = resolution;
          local.resolved_at = now;
        }
        return data[0];
      }
    } catch (dbErr) {
      console.warn('⚠️ Supabase resolveAlert warning (using local store):', dbErr.message);
    }
  }

  // Fallback to in-memory update
  const alert = qualityAlerts.find(a => a.id === alertId);
  if (!alert) return null;

  alert.status = 'Resolved';
  alert.resolution_notes = resolution;
  alert.resolved_at = now;
  return alert;
};

module.exports = {
  qualityAlerts,
  checkSpikeAlert,
  getAlerts,
  acknowledgeAlert,
  resolveAlert
};
