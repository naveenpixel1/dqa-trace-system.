// Storage layer for production logs with Supabase persistence and in-memory fallback
const { supabase } = require('../config/supabase');

const shiftLogs = [];
const MAX_LOGS = 10000; // Rolling in-memory buffer limit
let logSequenceCounter = 0;

/**
 * Creates a production log entry.
 * Persists to Supabase (PostgreSQL) when available, while always updating
 * the local in-memory buffer for fallback resilience.
 */
const addLog = async (logEntry) => {
  const now = new Date();
  const record = {
    id: `LOG-${now.getTime()}-${Math.floor(Math.random() * 1000)}`,
    seq: ++logSequenceCounter,
    timestamp: now.getTime(),
    tenant_id: logEntry.tenant_id,
    station_id: logEntry.station_id,
    shift: logEntry.shift || 'Shift A (Day)',
    operator_name: logEntry.operator_name || 'Operator 1',
    status: logEntry.status, // PASS, FAIL, REWORK
    serial_number: logEntry.serial_number || '',
    defects: Array.isArray(logEntry.defects) ? logEntry.defects : [],
    notes: logEntry.notes || '',
    created_at: now.toISOString()
  };

  // Always update in-memory ring buffer
  shiftLogs.push(record);
  if (shiftLogs.length > MAX_LOGS) {
    shiftLogs.splice(0, shiftLogs.length - MAX_LOGS);
  }

  // Attempt database persistence to Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('production_logs')
        .insert([{
          id: record.id,
          tenant_id: record.tenant_id,
          station_id: record.station_id,
          shift: record.shift,
          operator_name: record.operator_name,
          status: record.status,
          serial_number: record.serial_number,
          defects: record.defects,
          notes: record.notes,
          created_at: record.created_at
        }])
        .select();

      if (!error && data && data.length > 0) {
        return { ...record, ...data[0] };
      } else if (error) {
        console.warn('⚠️ Supabase production_logs insert warning (using in-memory fallback):', error.message);
      }
    } catch (dbErr) {
      console.warn('⚠️ Supabase unreachable (using in-memory fallback):', dbErr.message);
    }
  }

  return record;
};

/**
 * Retrieves the most recent logs for a specific station.
 * Essential for rolling spike threshold detection in stateless serverless environments.
 */
const getStationLogs = async (station_id, limit = 10) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('production_logs')
        .select('*')
        .eq('station_id', station_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (dbErr) {
      console.warn('⚠️ Supabase getStationLogs query warning (using in-memory fallback):', dbErr.message);
    }
  }

  // Fallback to in-memory store
  return shiftLogs
    .filter(l => l.station_id === station_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
};

/**
 * Retrieves all logs matching filters, Supabase-first with in-memory fallback.
 */
const getAllLogs = async (filters = {}) => {
  if (supabase) {
    try {
      let query = supabase
        .from('production_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.tenant_id) query = query.eq('tenant_id', filters.tenant_id);
      if (filters.station_id) query = query.eq('station_id', filters.station_id);
      if (filters.shift) query = query.eq('shift', filters.shift);

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (dbErr) {
      console.warn('⚠️ Supabase getAllLogs query warning (using in-memory fallback):', dbErr.message);
    }
  }

  // Fallback to in-memory store
  let filtered = shiftLogs;
  if (filters.tenant_id) filtered = filtered.filter(l => l.tenant_id === filters.tenant_id);
  if (filters.station_id) filtered = filtered.filter(l => l.station_id === filters.station_id);
  if (filters.shift) filtered = filtered.filter(l => l.shift === filters.shift);
  return [...filtered].reverse();
};

/**
 * Computes shift metrics and KPIs from Supabase or in-memory fallback.
 */
const getStats = async (filters = {}) => {
  const logs = await getAllLogs(filters);

  const totalInspected = logs.length;
  const passCount = logs.filter(l => l.status === 'PASS').length;
  const reworkCount = logs.filter(l => l.status === 'REWORK').length;
  const failCount = logs.filter(l => l.status === 'FAIL').length;

  const defectCount = logs.reduce((acc, log) => {
    const tagCount = (log.defects && log.defects.length) || 0;
    return acc + (log.status === 'FAIL' || log.status === 'REWORK' ? Math.max(1, tagCount) : tagCount);
  }, 0);

  const passRate = totalInspected > 0 ? Number(((passCount / totalInspected) * 100).toFixed(1)) : 100.0;

  return {
    totalInspected,
    passRate,
    reworkCount,
    defectCount,
    passCount,
    failCount,
    recentLogs: logs.slice(0, 10)
  };
};

module.exports = {
  addLog,
  getStationLogs,
  getAllLogs,
  getStats,
  shiftLogs
};
