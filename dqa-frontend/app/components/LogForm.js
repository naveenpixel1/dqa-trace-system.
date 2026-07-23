"use client";

import { useState, useRef, useEffect } from 'react';
import { useShift } from '../context/ShiftContext';
import SearchableSelect from './SearchableSelect';
import DefectSelector from './DefectSelector';
import CameraScannerModal from './CameraScannerModal';
import { 
  Building2, 
  Cpu, 
  Clock, 
  UserCheck, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Send, 
  Loader2, 
  Sparkles,
  AlertTriangle,
  Camera,
  Check
} from 'lucide-react';

export default function LogForm() {
  const {
    tenants,
    selectedTenantObj,
    setSelectedTenantObj,
    stations,
    selectedStationObj,
    setSelectedStationObj,
    defectTaxonomy,
    activeShift,
    setActiveShift,
    operatorName,
    setOperatorName,
    isLoadingAssets,
    isLoadingStations,
    assetError,
    stationError,
    submitInspection,
    showToast
  } = useShift();

  // Inspection-specific state (resets on submission)
  const [status, setStatus] = useState('PASS');
  const [serialNumber, setSerialNumber] = useState('');
  const [isScanVerified, setIsScanVerified] = useState(false);
  const [selectedDefects, setSelectedDefects] = useState([]);
  const [customOtherNote, setCustomOtherNote] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState({});

  // Input ref to automatically focus barcode input after submission
  const serialInputRef = useRef(null);

  // Focus barcode field on mount
  useEffect(() => {
    serialInputRef.current?.focus();
  }, []);

  // USB Barcode Keyboard Wedge Listener
  useEffect(() => {
    let keyBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e) => {
      // Only capture if input element is serial input or active background
      const now = Date.now();
      const timeDiff = now - lastKeyTime;
      lastKeyTime = now;

      if (timeDiff > 80) {
        keyBuffer = ''; // Reset buffer if typing is slow (manual entry)
      }

      if (e.key === 'Enter' && keyBuffer.length > 3) {
        // Scanner terminating Enter key detected
        setSerialNumber(keyBuffer);
        setIsScanVerified(true);
        showToast(`USB Barcode Scanned: ${keyBuffer}`, 'success');
        keyBuffer = '';
        e.preventDefault();
      } else if (e.key.length === 1) {
        keyBuffer += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showToast]);

  const handleTenantChange = (tenantOption) => {
    setSelectedTenantObj(tenantOption);
    setSelectedStationObj(null);
    setErrors((prev) => ({ ...prev, tenant: null, station: null }));
  };

  const handleStationChange = (stationOption) => {
    setSelectedStationObj(stationOption);
    setErrors((prev) => ({ ...prev, station: null }));
  };

  const handleAddDefect = (defectItem) => {
    setSelectedDefects((prev) => {
      const exists = prev.some(
        (d) => (typeof d === 'string' ? d === defectItem.name || d === defectItem.id : d.id === defectItem.id)
      );
      if (exists) return prev;
      return [...prev, defectItem];
    });
    setErrors((prev) => ({ ...prev, defects: null }));
  };

  const handleRemoveDefect = (defectItem) => {
    setSelectedDefects((prev) =>
      prev.filter(
        (d) => (typeof d === 'string' ? d !== defectItem && d !== defectItem.name && d !== defectItem.id : d.id !== defectItem.id && d.name !== defectItem.name)
      )
    );
  };

  const handleCameraScanSuccess = (code) => {
    setSerialNumber(code);
    setIsScanVerified(true);
    showToast(`Camera Scanned: ${code}`, 'success');
    serialInputRef.current?.focus();
  };

  const handleResetInspectionFields = () => {
    setStatus('PASS');
    setSerialNumber('');
    setIsScanVerified(false);
    setSelectedDefects([]);
    setCustomOtherNote('');
    setNotes('');
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedTenantObj?.id) {
      newErrors.tenant = 'Factory Unit / Tenant selection is required.';
    }

    if (!selectedStationObj?.id) {
      newErrors.station = 'Machine Bench / Station selection is required.';
    }

    if ((status === 'FAIL' || status === 'REWORK') && selectedDefects.length === 0) {
      newErrors.defects = `At least one defect category is required when inspection result is ${status}.`;
    }

    const isOtherSelected = selectedDefects.some(
      (d) => (typeof d === 'string' ? d === 'Other' || d === 'DEF-OTHER' : d.name === 'Other' || d.id === 'DEF-OTHER')
    );

    if (isOtherSelected && !customOtherNote.trim()) {
      newErrors.defects = 'Please provide a custom description for the "Other" defect category.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) {
      showToast('Please resolve validation errors before submitting.', 'error');
      return;
    }

    setIsSubmitting(true);

    const defectNames = selectedDefects.map((d) => (typeof d === 'string' ? d : d.name));
    const combinedNotes = customOtherNote.trim()
      ? `[Other: ${customOtherNote.trim()}] ${notes.trim()}`
      : notes.trim();

    try {
      const res = await submitInspection({
        status,
        serialNumber,
        defects: defectNames,
        notes: combinedNotes
      });

      if (res.success) {
        setTimeout(() => {
          handleResetInspectionFields();
          serialInputRef.current?.focus();
        }, 150);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Dynamic Asset & Station Panel */}
      <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-wide">Factory & Station Context</h3>
            <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/50">
              Dynamic Assets
            </span>
          </div>

          {assetError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{assetError}</span>
            </div>
          )}

          <div className="space-y-4">
            <SearchableSelect
              label="Tenant / Factory Unit"
              icon={Building2}
              options={tenants}
              value={selectedTenantObj?.id}
              onChange={handleTenantChange}
              placeholder="Search or select Factory Unit..."
              loading={isLoadingAssets}
              error={errors.tenant}
              emptyMessage="No active factory units available"
            />

            <SearchableSelect
              label="Station / Machine Bench"
              icon={Cpu}
              options={stations}
              value={selectedStationObj?.id}
              onChange={handleStationChange}
              placeholder={selectedTenantObj ? 'Search or select Machine Bench...' : 'Select a Factory Unit first'}
              disabled={!selectedTenantObj?.id}
              loading={isLoadingStations}
              error={errors.station || stationError}
              emptyMessage="No active machine benches found for this factory unit"
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Active Shift Schedule
              </label>
              <select
                value={activeShift}
                onChange={(e) => setActiveShift(e.target.value)}
                className="w-full p-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs font-semibold transition-colors"
              >
                <option value="Shift A (06:00 - 14:00)">Shift A (06:00 - 14:00)</option>
                <option value="Shift B (14:00 - 22:00)">Shift B (14:00 - 22:00)</option>
                <option value="Shift C (22:00 - 06:00)">Shift C (22:00 - 06:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Operator Name / ID
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="e.g. John Doe (#402)"
                className="w-full p-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs font-medium transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
          <p>📷 Supports USB Wedge Scanners, Web Camera QR reading, and ESP32 / PLC IoT edge device triggers.</p>
        </div>
      </div>

      {/* Active Inspection Form Panel */}
      <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 p-5 sm:p-6 rounded-2xl shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
              Quality Inspection Form
            </h3>
            <span className="text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full font-mono border border-slate-700/50">
              IoT & Wedge Enabled
            </span>
          </div>

          {/* Barcode / Serial Input with Camera Scan & USB Wedge Listener */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-emerald-400" />
                Barcode / Serial Number / Lot ID
              </label>

              {isScanVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 animate-in fade-in duration-150">
                  <Check className="w-3 h-3 text-emerald-400" />
                  Scan Verified
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={serialInputRef}
                type="text"
                value={serialNumber}
                onChange={(e) => {
                  setSerialNumber(e.target.value);
                  if (isScanVerified) setIsScanVerified(false);
                }}
                placeholder="Scan barcode via USB/Camera or type lot ID (e.g. SN-99482)"
                disabled={isSubmitting}
                className="flex-1 p-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 font-mono text-sm shadow-inner transition-colors disabled:opacity-50"
              />

              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                title="Open Camera QR/Barcode Scanner"
                className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-semibold text-xs flex items-center gap-1.5 shrink-0 transition-colors"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                Scan Camera
              </button>
            </div>
          </div>

          {/* Quality Result Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Quality Check Status
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'PASS', label: 'PASS', icon: CheckCircle2, activeBg: 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-950' },
                { id: 'FAIL', label: 'FAIL', icon: XCircle, activeBg: 'bg-rose-600 border-rose-400 text-white shadow-lg shadow-rose-950' },
                { id: 'REWORK', label: 'REWORK', icon: RotateCcw, activeBg: 'bg-amber-600 border-amber-400 text-white shadow-lg shadow-amber-950' }
              ].map((item) => {
                const ItemIcon = item.icon;
                const isSelected = status === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => {
                      setStatus(item.id);
                      setErrors((prev) => ({ ...prev, defects: null }));
                    }}
                    className={`p-3.5 rounded-xl font-bold tracking-wider text-xs sm:text-sm border flex items-center justify-center gap-2 transition-all ${
                      isSelected
                        ? item.activeBg + ' scale-[1.02]'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    } disabled:opacity-50`}
                  >
                    <ItemIcon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Defect Selector */}
          <DefectSelector
            taxonomy={defectTaxonomy}
            selectedDefects={selectedDefects}
            onSelectDefect={handleAddDefect}
            onRemoveDefect={handleRemoveDefect}
            customOtherNote={customOtherNote}
            onCustomOtherNoteChange={(val) => {
              setCustomOtherNote(val);
              setErrors((prev) => ({ ...prev, defects: null }));
            }}
            disabled={isSubmitting}
            error={errors.defects}
          />

          {/* Additional Observations */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Additional Inspection Observations (Optional)
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              placeholder="Type any supplementary notes or shift remarks..."
              className="w-full p-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500 text-xs shadow-inner transition-colors disabled:opacity-50"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 p-3.5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Inspection...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit Quality Entry
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleResetInspectionFields}
              className="px-4 py-3.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl font-semibold text-xs transition-colors disabled:opacity-50"
            >
              Clear Fields
            </button>
          </div>
        </form>
      </div>

      {/* Web Camera Barcode Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />
    </div>
  );
}