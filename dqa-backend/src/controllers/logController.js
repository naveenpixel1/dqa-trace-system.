const { supabase } = require('../config/supabase');

const createProductionLog = async (req, res) => {
  try {
    const { tenant_id, station_id, status, notes } = req.body;

    // Send the data directly down to our Supabase database table
    const { data, error } = await supabase
      .from('production_logs')
      .insert([{ tenant_id, station_id, status, notes }])
      .select();

    if (error) throw error;

    // Send back a success message in a standardized format
    return res.status(201).json({
      success: true,
      data: data[0],
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