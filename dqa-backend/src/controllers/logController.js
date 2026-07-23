const { supabase } = require('../config/supabase');
const { addLog } = require('../store/logStore');
const { checkSpikeAlert } = require('../store/alertStore');

const createProductionLog = async (req, res) => {
  try {
    const { tenant_id, station_id, status, notes, shift, operator_name, serial_number, defects } = req.body;

    // 1. Save in in-memory store for instant analytics
    const localRecord = addLog({
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
    const triggeredAlert = checkSpikeAlert(station_id, tenant_id);

    let dbData = localRecord;

    // Send data to Supabase if available
    try {
      const { data, error } = await supabase
        .from('production_logs')
        .insert([{ tenant_id, station_id, status, notes }])
        .select();

      if (!error && data && data.length > 0) {
        dbData = { ...localRecord, ...data[0] };
      }
    } catch (dbErr) {
      console.warn('Supabase insert warning (using local store):', dbErr.message);
    }

    return res.status(201).json({
      success: true,
      data: dbData,
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