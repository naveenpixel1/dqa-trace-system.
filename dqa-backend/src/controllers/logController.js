const { addLog } = require('../store/logStore');
const { checkSpikeAlert } = require('../store/alertStore');

const createProductionLog = async (req, res) => {
  try {
    const { tenant_id, station_id, status, notes, shift, operator_name, serial_number, defects } = req.body;

    // 1. Save log entry (Supabase-first with in-memory fallback)
    const record = await addLog({
      tenant_id,
      station_id,
      status,
      notes,
      shift,
      operator_name,
      serial_number,
      defects
    });

    // 2. Automatically evaluate 3-consecutive-FAIL spike threshold rule on station
    const triggeredAlert = await checkSpikeAlert(station_id, tenant_id);

    return res.status(201).json({
      success: true,
      data: record,
      triggeredAlert: triggeredAlert || null,
      error: null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      data: null,
      error: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = { createProductionLog };