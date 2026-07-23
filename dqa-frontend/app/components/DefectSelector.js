"use client";

import { useState, useRef, useEffect } from 'react';
import { Tag, Search, X, Plus, AlertCircle, Sparkles, Edit3 } from 'lucide-react';

export default function DefectSelector({
  taxonomy = [],
  selectedDefects = [],
  onSelectDefect,
  onRemoveDefect,
  customOtherNote = '',
  onCustomOtherNoteChange,
  disabled = false,
  error = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const isOtherSelected = selectedDefects.some(
    (d) => d === 'Other' || d === 'DEF-OTHER' || (typeof d === 'object' && (d.name === 'Other' || d.id === 'DEF-OTHER'))
  );

  // Filter defect taxonomy items
  const filteredGroups = taxonomy.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const query = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
      );
    })
  })).filter((group) => group.items.length > 0);

  const handleToggleItem = (item) => {
    const isSelected = selectedDefects.some(
      (d) => (typeof d === 'string' ? d === item.name || d === item.id : d.id === item.id)
    );

    if (isSelected) {
      onRemoveDefect(item);
    } else {
      onSelectDefect(item);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-amber-400" />
          Defect Categorization
        </label>
        <span className="text-[11px] font-medium text-slate-400">
          {selectedDefects.length} selected
        </span>
      </div>

      {/* Selected Defect Chips Display */}
      <div className="flex flex-wrap items-center gap-2 min-h-[38px] p-2 bg-slate-950/80 border border-slate-800 rounded-xl">
        {selectedDefects.length > 0 ? (
          selectedDefects.map((defect) => {
            const defectName = typeof defect === 'string' ? defect : defect.name;
            const defectId = typeof defect === 'string' ? defect : defect.id;
            const isOther = defectName === 'Other' || defectId === 'DEF-OTHER';

            return (
              <span
                key={defectId || defectName}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  isOther
                    ? 'bg-purple-950/80 border-purple-500/60 text-purple-200'
                    : 'bg-rose-950/80 border-rose-500/60 text-rose-200'
                }`}
              >
                <span>{defectName}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => onRemoveDefect(defect)}
                    className="p-0.5 rounded hover:bg-slate-800/80 text-slate-400 hover:text-white"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            );
          })
        ) : (
          <span className="text-xs text-slate-500 italic pl-1">
            No defect categories selected. Click &quot;Add Defect Category&quot; below.
          </span>
        )}
      </div>

      {/* Dropdown Toggle Button */}
      <div ref={dropdownRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition-all ${
            disabled
              ? 'bg-slate-950/50 border-slate-800 text-slate-600 cursor-not-allowed'
              : error
              ? 'bg-rose-950/30 border-rose-500/60 text-rose-200'
              : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
          }`}
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-400" />
            Add Defect Category from Taxonomy
          </span>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-900 rounded text-slate-400">
            Standard Taxonomy
          </span>
        </button>

        {/* Dropdown Popup menu */}
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Search filter */}
            <div className="p-2 border-b border-slate-800 bg-slate-950/90 sticky top-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search defect category..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Categorized Options List */}
            <div className="max-h-64 overflow-y-auto p-2 text-xs space-y-3">
              {filteredGroups.length > 0 ? (
                filteredGroups.map((group) => (
                  <div key={group.group}>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 bg-slate-950/60 rounded mb-1 border-l-2 border-amber-500">
                      {group.group}
                    </div>
                    <div className="grid grid-cols-1 gap-1">
                      {group.items.map((item) => {
                        const isChecked = selectedDefects.some(
                          (d) => (typeof d === 'string' ? d === item.name || d === item.id : d.id === item.id)
                        );
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleToggleItem(item)}
                            className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                              isChecked
                                ? 'bg-amber-950/60 border border-amber-800/60 text-amber-200 font-semibold'
                                : 'hover:bg-slate-800/80 text-slate-300'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-slate-200">{item.name}</div>
                              {item.description && (
                                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                                  {item.description}
                                </div>
                              )}
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded font-mono ${isChecked ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-500'}`}>
                              {isChecked ? '✓ Added' : '+ Add'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-slate-500 text-xs">No defect categories found</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Conditional Custom Notes input when "Other" is selected */}
      {isOtherSelected && (
        <div className="p-3 bg-purple-950/30 border border-purple-800/60 rounded-xl space-y-1.5 animate-in fade-in duration-200">
          <label className="block text-xs font-bold text-purple-300 flex items-center gap-1.5">
            <Edit3 className="w-3.5 h-3.5 text-purple-400" />
            Custom Defect Description (Required for &quot;Other&quot;)
          </label>
          <input
            type="text"
            value={customOtherNote}
            onChange={(e) => onCustomOtherNoteChange(e.target.value)}
            disabled={disabled}
            placeholder="Type specific defect observations or root cause details..."
            className="w-full p-2.5 bg-slate-950 text-white rounded-lg border border-purple-800/80 focus:outline-none focus:border-purple-400 text-xs"
          />
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-[11px] text-rose-400 flex items-center gap-1 font-medium">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
