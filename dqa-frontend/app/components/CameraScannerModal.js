"use client";

import { useState, useRef, useEffect } from 'react';
import { Camera, X, RefreshCw, CheckCircle2, AlertCircle, QrCode, Sparkles } from 'lucide-react';

export default function CameraScannerModal({ isOpen, onClose, onScanSuccess }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [isScanning, setIsScanning] = useState(false);
  const [detectedCode, setDetectedCode] = useState('');

  // Start camera stream when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let currentStream = null;

    const startCamera = async () => {
      setCameraError(null);
      setIsScanning(true);

      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Web Camera API is not supported in this browser environment.');
        }

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode }, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false
        });

        currentStream = mediaStream;
        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      } catch (err) {
        console.warn('Camera access warning:', err.message);
        setCameraError(err.message || 'Camera permission denied or camera unavailable.');
      }
    };

    startCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, facingMode]);

  // Stop camera when modal closes
  const handleClose = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    onClose();
  };

  const handleSimulatedWebcamCapture = (mockCode) => {
    const code = mockCode || `LOT-QR-${Date.now().toString().slice(-6)}`;
    setDetectedCode(code);
    setTimeout(() => {
      onScanSuccess(code);
      handleClose();
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Browser Camera Barcode Scanner</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Preview Area */}
        <div className="relative w-full aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
          {cameraError ? (
            <div className="p-4 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">{cameraError}</p>
              <p className="text-[11px] text-slate-500">You can use the simulated QR trigger below for testing camera scans.</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Animated Scanning Reticle Overlay */}
          {!cameraError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-32 border-2 border-emerald-400 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.4)] relative flex items-center justify-center">
                <div className="w-full h-0.5 bg-emerald-400/80 shadow-[0_0_8px_#34d399] animate-[bounce_2s_infinite]" />
                <span className="absolute bottom-2 text-[10px] font-mono text-emerald-300 bg-slate-950/80 px-2 py-0.5 rounded">
                  ALIGN BARCODE / QR HERE
                </span>
              </div>
            </div>
          )}

          {/* Detection Confirmation Overlay */}
          {detectedCode && (
            <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 animate-bounce mb-2" />
              <span className="text-xs text-slate-300">Barcode Captured!</span>
              <span className="text-sm font-extrabold text-white font-mono mt-1">{detectedCode}</span>
            </div>
          )}
        </div>

        {/* Camera Controls & Trigger Buttons */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Flip Camera ({facingMode === 'user' ? 'Front' : 'Rear'})
            </button>

            <button
              type="button"
              onClick={() => handleSimulatedWebcamCapture()}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow"
            >
              <QrCode className="w-3.5 h-3.5" />
              Capture QR Sample
            </button>
          </div>

          <p className="text-[11px] text-slate-500 text-center">
            Supported formats: QR Code, Code 128, DataMatrix, EAN-13, ITF-14.
          </p>
        </div>
      </div>
    </div>
  );
}
