const { getStats } = require('../store/logStore');

const getShiftStats = async (req, res) => {
  try {
    const { tenant_id, station_id, shift } = req.query;

    // Get live stats (queries Supabase with fallback to in-memory)
    const stats = await getStats({ tenant_id, station_id, shift });

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
