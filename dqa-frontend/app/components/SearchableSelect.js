"use client";

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Loader2, Check, X, AlertCircle } from 'lucide-react';

export default function SearchableSelect({
  label,
  icon: Icon,
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  loading = false,
  error = null,
  emptyMessage = 'No options available'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Selected item finding
  const selectedOption = options.find((opt) => opt.id === value || opt.value === value);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredOptions = options.filter((opt) => {
    const term = searchQuery.toLowerCase();
    const nameMatch = opt.name ? opt.name.toLowerCase().includes(term) : false;
    const codeMatch = opt.code ? opt.code.toLowerCase().includes(term) : false;
    const labelMatch = opt.label ? opt.label.toLowerCase().includes(term) : false;
    return nameMatch || codeMatch || labelMatch;
  });

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            {Icon && <Icon className="w-3.5 h-3.5 text-cyan-400" />}
            {label}
          </span>
          {loading && <span className="text-[10px] text-cyan-400 font-normal">Loading...</span>}
        </label>
      )}

      {/* Select Control Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-2.5 rounded-xl border text-xs font-medium text-left flex items-center justify-between gap-2 transition-all ${
          disabled
            ? 'bg-slate-950/50 border-slate-800/80 text-slate-600 cursor-not-allowed'
            : error
            ? 'bg-rose-950/30 border-rose-500/60 text-rose-200'
            : isOpen
            ? 'bg-slate-950 border-cyan-500 ring-1 ring-cyan-500/40 text-white'
            : 'bg-slate-950 border-slate-800 text-white hover:border-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Fetching options...</span>
            </div>
          ) : selectedOption ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="truncate text-slate-100 font-semibold">{selectedOption.name || selectedOption.label}</span>
              {selectedOption.code && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-cyan-300 border border-slate-700">
                  {selectedOption.code}
                </span>
              )}
            </div>
          ) : (
            <span className="text-slate-500">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}

      {/* Dropdown Options Popup */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Box inside dropdown */}
          <div className="p-2 border-b border-slate-800 bg-slate-950/80 sticky top-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-900 text-white rounded-lg border border-slate-800 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto p-1 text-xs space-y-0.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = selectedOption && (selectedOption.id === opt.id || selectedOption.value === opt.value);
                return (
                  <button
                    key={opt.id || opt.value || opt.name}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                      isSelected
                        ? 'bg-cyan-950/80 text-cyan-200 border border-cyan-800/60 font-semibold'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-200">{opt.name || opt.label}</span>
                      {opt.code && <span className="text-[10px] text-slate-400 font-mono">{opt.code}</span>}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                );
              })
            ) : (
              <div className="p-4 text-center text-slate-500 text-xs">{emptyMessage}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
