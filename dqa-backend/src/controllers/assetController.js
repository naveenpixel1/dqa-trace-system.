const { TENANTS, STATIONS, DEFECT_TAXONOMY } = require('../store/assetStore');
const { supabase } = require('../config/supabase');

const getTenants = async (req, res) => {
  try {
    let tenants = [];

    // Attempt querying Supabase tenants table
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        tenants = data;
      }
    } catch (dbErr) {
      console.warn('Supabase tenants query warning, using local seed:', dbErr.message);
    }

    // Fallback to active seeded tenants if DB is empty/unreachable
    if (tenants.length === 0) {
      tenants = TENANTS.filter(t => t.is_active).sort((a, b) => a.name.localeCompare(b.name));
    }

    return res.status(200).json({
      success: true,
      data: tenants,
      error: null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      error: error.message || 'Failed to fetch tenants'
    });
  }
};

const getStations = async (req, res) => {
  try {
    const { tenant_id } = req.query;

    if (!tenant_id) {
      return res.status(400).json({
        success: false,
        data: [],
        error: 'tenant_id query parameter is required'
      });
    }

    let stations = [];

    // Attempt querying Supabase stations table
    try {
      const { data, error } = await supabase
        .from('stations')
        .select('*')
        .eq('tenant_id', tenant_id)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        stations = data;
      }
    } catch (dbErr) {
      console.warn('Supabase stations query warning, using local seed:', dbErr.message);
    }

    // Fallback to active seeded stations for tenant
    if (stations.length === 0) {
      stations = STATIONS.filter(s => s.tenant_id === tenant_id && s.is_active)
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return res.status(200).json({
      success: true,
      data: stations,
      error: null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      error: error.message || 'Failed to fetch stations'
    });
  }
};

const getDefectCategories = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: DEFECT_TAXONOMY,
      error: null
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      data: [],
      error: error.message || 'Failed to fetch defect taxonomy'
    });
  }
};

module.exports = {
  getTenants,
  getStations,
  getDefectCategories
};
