const { getStats } = require('../store/logStore');
const { supabase } = require('../config/supabase');

const getShiftStats = async (req, res) => {
  try {
    const { tenant_id, station_id, shift } = req.query;

    // Get live in-memory stats
    const stats = getStats({ tenant_id, station_id, shift });

    // Try fetching database count if available
    try {
      let query = supabase.from('production_logs').select('status', { count: 'exact' });
      if (tenant_id) query = query.eq('tenant_id', tenant_id);
      if (station_id) query = query.eq('station_id', station_id);

      const { data, error } = await query;
      if (!error && data) {
        // If DB has records, we can merge or enhance stats if needed
      }
    } catch (dbErr) {
      // Fallback silently to in-memory stats
    }

    return res.status(200).json({
      success: true,
      data: stats,
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

module.exports = { getShiftStats };
