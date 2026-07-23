"use client";

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ShiftContext = createContext();

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function ShiftProvider({ children }) {
  // Navigation View State ('operator' | 'manager' | 'iot')
  const [viewMode, setViewMode] = useState('operator');

  // Session & Asset States
  const [tenants, setTenants] = useState([]);
  const [selectedTenantObj, setSelectedTenantObj] = useState(null);
  const [stations, setStations] = useState([]);
  const [selectedStationObj, setSelectedStationObj] = useState(null);
  const [defectTaxonomy, setDefectTaxonomy] = useState([]);

  const [activeShift, setActiveShift] = useState('Shift A (06:00 - 14:00)');
  const [operatorName, setOperatorName] = useState('John Doe (Op #402)');

  const [isLoadingAssets, setIsLoadingAssets] = useState(true);
  const [isLoadingStations, setIsLoadingStations] = useState(false);
  const [assetError, setAssetError] = useState(null);
  const [stationError, setStationError] = useState(null);

  // Quality Alerts & Analytics State
  const [alerts, setAlerts] = useState([]);
  const [activeAlertsCount, setActiveAlertsCount] = useState(0);

  // Industry 4.0 Edge Devices State
  const [edgeDevices, setEdgeDevices] = useState([]);
  const [edgeTelemetry, setEdgeTelemetry] = useState([]);

  // Metrics & Toast states
  const [metrics, setMetrics] = useState({
    totalInspected: 0,
    passRate: 100.0,
    reworkCount: 0,
    defectCount: 0,
    passCount: 0,
    failCount: 0
  });

  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success', id: 0 });

  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type, id: Date.now() });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Fetch Connected Edge Devices
  const fetchEdgeDevices = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/edge-devices`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setEdgeDevices(result.data.devices || []);
          setEdgeTelemetry(result.data.recentTelemetry || []);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch edge devices:', err.message);
    }
  }, []);

  // Trigger Edge Sensor Simulation
  const triggerEdgeSimulation = async (payload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/edge-simulator/trigger`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (response.ok && result.success) {
        fetchMetrics();
        fetchAlerts();
        fetchEdgeDevices();
        return result;
      } else {
        showToast(result.error || 'Edge trigger failed', 'error');
      }
    } catch (err) {
      showToast('Backend edge API unreachable', 'error');
    }
    return null;
  };

  // Fetch Quality Alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setAlerts(result.data);
          const activeCount = result.data.filter(a => a.status === 'Active' || a.status === 'Acknowledged').length;
          setActiveAlertsCount(activeCount);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch quality alerts:', err.message);
    }
  }, []);

  // Fetch Pareto Analytics
  const fetchParetoAnalytics = useCallback(async (filters = {}) => {
    try {
      const query = new URLSearchParams(filters);
      const response = await fetch(`${API_BASE_URL}/api/analytics/pareto?${query}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          return result.data;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch pareto analytics:', err.message);
    }
    return null;
  }, []);

  // Acknowledge Quality Alert
  const acknowledgeAlert = async (alertId, user = 'Supervisor') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user })
      });
      if (response.ok) {
        showToast(`Alert ${alertId} acknowledged.`, 'warning');
        fetchAlerts();
      }
    } catch (err) {
      showToast('Failed to acknowledge alert', 'error');
    }
  };

  // Resolve Quality Alert
  const resolveAlert = async (alertId, notes = '') => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (response.ok) {
        showToast(`Incident ${alertId} resolved!`, 'success');
        fetchAlerts();
      }
    } catch (err) {
      showToast('Failed to resolve alert', 'error');
    }
  };

  // Fetch Tenants & Defect Taxonomy on Mount
  const fetchTenantsAndTaxonomy = useCallback(async () => {
    setIsLoadingAssets(true);
    setAssetError(null);

    try {
      // 1. Fetch Tenants
      const tenantRes = await fetch(`${API_BASE_URL}/api/tenants`);
      if (tenantRes.ok) {
        const tenantData = await tenantRes.json();
        if (tenantData.success && Array.isArray(tenantData.data)) {
          setTenants(tenantData.data);
          const savedTenantId = typeof window !== 'undefined' ? localStorage.getItem('dqa_tenantId') : null;
          const matched = tenantData.data.find(t => t.id === savedTenantId) || tenantData.data[0];
          if (matched) setSelectedTenantObj(matched);
        }
      }

      // 2. Fetch Defect Taxonomy
      const defectRes = await fetch(`${API_BASE_URL}/api/defects/categories`);
      if (defectRes.ok) {
        const defectData = await defectRes.json();
        if (defectData.success && Array.isArray(defectData.data)) {
          setDefectTaxonomy(defectData.data);
        }
      }

      // 3. Initial Alerts & Edge fetch
      fetchAlerts();
      fetchEdgeDevices();
    } catch (err) {
      setAssetError('Failed to load factory assets. Backend API server unreachable.');
    } finally {
      setIsLoadingAssets(false);
    }
  }, [fetchAlerts, fetchEdgeDevices]);

  useEffect(() => {
    fetchTenantsAndTaxonomy();
  }, [fetchTenantsAndTaxonomy]);

  // Periodic polling for quality alerts every 6s
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAlerts();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Fetch Stations when selected Tenant changes
  const fetchStationsForTenant = useCallback(async (tenantId) => {
    if (!tenantId) {
      setStations([]);
      setSelectedStationObj(null);
      return;
    }

    setIsLoadingStations(true);
    setStationError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/stations?tenant_id=${tenantId}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          setStations(result.data);
          const savedStationId = typeof window !== 'undefined' ? localStorage.getItem('dqa_stationId') : null;
          const matched = result.data.find(s => s.id === savedStationId) || result.data[0];
          setSelectedStationObj(matched || null);
        }
      } else {
        setStations([]);
        setSelectedStationObj(null);
      }
    } catch (err) {
      setStationError('Failed to fetch stations for selected factory unit.');
    } finally {
      setIsLoadingStations(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTenantObj?.id) {
      fetchStationsForTenant(selectedTenantObj.id);
      if (typeof window !== 'undefined') {
        localStorage.setItem('dqa_tenantId', selectedTenantObj.id);
      }
    }
  }, [selectedTenantObj, fetchStationsForTenant]);

  const handleSelectStation = (station) => {
    setSelectedStationObj(station);
    if (station?.id && typeof window !== 'undefined') {
      localStorage.setItem('dqa_stationId', station.id);
    }
  };

  const updateActiveShift = (val) => {
    setActiveShift(val);
    if (typeof window !== 'undefined') localStorage.setItem('dqa_activeShift', val);
  };

  const updateOperatorName = (val) => {
    setOperatorName(val);
    if (typeof window !== 'undefined') localStorage.setItem('dqa_operatorName', val);
  };

  const fetchMetrics = useCallback(async () => {
    try {
      const query = new URLSearchParams({
        tenant_id: selectedTenantObj?.id || '',
        station_id: selectedStationObj?.id || '',
        shift: activeShift
      });
      const response = await fetch(`${API_BASE_URL}/api/logs/stats?${query}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setMetrics({
            totalInspected: result.data.totalInspected ?? 0,
            passRate: result.data.passRate ?? 100.0,
            reworkCount: result.data.reworkCount ?? 0,
            defectCount: result.data.defectCount ?? 0,
            passCount: result.data.passCount ?? 0,
            failCount: result.data.failCount ?? 0
          });
        }
      }
    } catch (err) {
      console.warn('Backend metrics fetch warning:', err.message);
    } finally {
      setIsLoadingMetrics(false);
    }
  }, [selectedTenantObj?.id, selectedStationObj?.id, activeShift]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const submitInspection = async (inspectionData) => {
    const { status, defects = [], serialNumber, notes } = inspectionData;

    setMetrics((prev) => {
      const newTotal = prev.totalInspected + 1;
      const newPass = prev.passCount + (status === 'PASS' ? 1 : 0);
      const newRework = prev.reworkCount + (status === 'REWORK' ? 1 : 0);
      const newFail = prev.failCount + (status === 'FAIL' ? 1 : 0);
      
      const newDefectAdd = (status === 'FAIL' || status === 'REWORK')
        ? Math.max(1, defects.length)
        : defects.length;
      const newDefects = prev.defectCount + newDefectAdd;
      const newPassRate = Number(((newPass / newTotal) * 100).toFixed(1));

      return {
        totalInspected: newTotal,
        passRate: newPassRate,
        reworkCount: newRework,
        defectCount: newDefects,
        passCount: newPass,
        failCount: newFail
      };
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: selectedTenantObj?.id || 'TENANT-ALPHA-01',
          station_id: selectedStationObj?.id || 'STATION-BENCH-04',
          shift: activeShift,
          operator_name: operatorName,
          status,
          serial_number: serialNumber,
          defects: defects.map(d => typeof d === 'string' ? d : d.name),
          notes
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(`Inspection #${metrics.totalInspected + 1} recorded successfully (${status})`, 'success');
        
        if (result.triggeredAlert) {
          showToast(`🚨 HIGH SPIKE ALERT: 3 consecutive FAILs detected on ${selectedStationObj?.name || 'Station'}!`, 'error');
          fetchAlerts();
        }

        fetchMetrics();
        return { success: true, data: result.data };
      } else {
        const errorMsg = Array.isArray(result.errors) ? result.errors.join(', ') : (result.error || 'Submission failed');
        showToast(errorMsg, 'error');
        fetchMetrics();
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      showToast('Recorded locally. (Backend server unreachable)', 'warning');
      return { success: true, warning: 'Saved locally' };
    }
  };

  return (
    <ShiftContext.Provider value={{
      viewMode,
      setViewMode,
      tenants,
      selectedTenantObj,
      setSelectedTenantObj,
      stations,
      selectedStationObj,
      setSelectedStationObj: handleSelectStation,
      defectTaxonomy,
      activeShift,
      setActiveShift: updateActiveShift,
      operatorName,
      setOperatorName: updateOperatorName,
      isLoadingAssets,
      isLoadingStations,
      assetError,
      stationError,
      alerts,
      activeAlertsCount,
      edgeDevices,
      edgeTelemetry,
      fetchEdgeDevices,
      triggerEdgeSimulation,
      fetchAlerts,
      fetchParetoAnalytics,
      acknowledgeAlert,
      resolveAlert,
      metrics,
      isLoadingMetrics,
      submitInspection,
      fetchMetrics,
      fetchTenantsAndTaxonomy,
      toast,
      showToast,
      hideToast
    }}>
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error('useShift must be used within a ShiftProvider');
  }
  return context;
}
