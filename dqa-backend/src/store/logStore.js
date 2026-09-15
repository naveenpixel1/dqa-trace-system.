// In-memory store for real-time shift analytics and offline resilience
const shiftLogs = [];
const MAX_LOGS = 10000; // Rolling memory ring buffer limit
let logSequenceCounter = 0;

const addLog = (logEntry) => {
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
  
  shiftLogs.push(record);
  
  // Enforce bounded memory retention to prevent OOM on rapid edge ingestion
  if (shiftLogs.length > MAX_LOGS) {
    shiftLogs.splice(0, shiftLogs.length - MAX_LOGS);
  }

  return record;
};

const getStats = (filters = {}) => {
  let filtered = shiftLogs;

  if (filters.tenant_id) {
    filtered = filtered.filter(l => l.tenant_id === filters.tenant_id);
  }
  if (filters.station_id) {
    filtered = filtered.filter(l => l.station_id === filters.station_id);
  }
  if (filters.shift) {
    filtered = filtered.filter(l => l.shift === filters.shift);
  }

  const totalInspected = filtered.length;
  const passCount = filtered.filter(l => l.status === 'PASS').length;
  const reworkCount = filtered.filter(l => l.status === 'REWORK').length;
  const failCount = filtered.filter(l => l.status === 'FAIL').length;
  
  // Total defects count = fail inspections + total defect tags selected across logs
  const defectCount = filtered.reduce((acc, log) => {
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
    recentLogs: filtered.slice(-10).reverse()
  };
};

module.exports = {
  addLog,
  getStats,
  shiftLogs
};
