'use client';

import { useEffect, useRef, useState } from 'react';
import { XMarkIcon, CameraIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export default function BarcodeScannerModal({ isOpen, onClose, onDetected }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const videoContainerId = "barcode-video-container";
  const detectedRef = useRef(false);
  
  const [status, setStatus] = useState<'loading' | 'scanning' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  
  const [capabilities, setCapabilities] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [torch, setTorch] = useState(false);
  const [activeTrack, setActiveTrack] = useState<MediaStreamTrack | null>(null);

  const cleanup = async () => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          console.error("Error stopping scanner", e);
        }
      }
      try {
        scannerRef.current.clear();
      } catch (e) {}
      scannerRef.current = null;
    }
    setActiveTrack(null);
    setCapabilities(null);
  };

  const handleToggleTorch = async () => {
    if (!activeTrack || !capabilities?.torch) return;
    const nextTorch = !torch;
    try {
      await (activeTrack as any).applyConstraints({ advanced: [{ torch: nextTorch }] });
      setTorch(nextTorch);
    } catch (e) {
      console.error("Error toggling torch", e);
    }
  };

  const handleZoomChange = async (value: number) => {
    if (!activeTrack || !capabilities?.zoom) return;
    try {
      await (activeTrack as any).applyConstraints({ advanced: [{ zoom: value }] });
      setZoom(value);
    } catch (e) {
      console.error("Error setting zoom", e);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    detectedRef.current = false;
    setStatus('loading');
    setErrorMsg('');
    setDebugInfo('');
    setTorch(false);
    setZoom(1);

    let isMounted = true;

    const startScanner = async () => {
      // 1. Verificar que el contenedor existe
      const container = document.getElementById(videoContainerId);
      if (!container) {
        if (isMounted) {
          setTimeout(startScanner, 200); // Reintentar si el DOM no está listo
        }
        return;
      }

      try {
        const html5QrCode = new Html5Qrcode(videoContainerId);
        scannerRef.current = html5QrCode;

        // 2. Obtener cámaras disponibles para encontrar la trasera real
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          throw new Error("No se detectaron cámaras en este dispositivo.");
        }

        // Priorizar cámara trasera que contenga 'back' o sea la última de la lista
        const backCamera = devices.find(d => d.label.toLowerCase().includes('back')) || devices[devices.length - 1];
        const cameraId = backCamera.id;

        const config = {
          fps: 25,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.min(viewfinderWidth * 0.85, 320);
            const height = 140;
            return { width, height };
          },
          aspectRatio: 1.0,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF
          ],
          disableFlip: true,
        };

        await html5QrCode.start(
          cameraId,
          config,
          (decodedText) => {
            if (!detectedRef.current && isMounted) {
              detectedRef.current = true;
              cleanup().then(() => {
                onDetected(decodedText);
                onClose();
              });
            }
          },
          undefined
        );

        if (!isMounted) {
          await cleanup();
          return;
        }

        setStatus('scanning');

        // 3. Configurar capacidades avanzadas (Zoom/Torch)
        // @ts-ignore
        const videoElement = container.querySelector('video');
        if (videoElement && videoElement.srcObject) {
          const track = (videoElement.srcObject as MediaStream).getVideoTracks()[0];
          setActiveTrack(track);

          if (track && track.getCapabilities) {
            const caps = track.getCapabilities();
            setCapabilities(caps);

            if (caps.zoom) {
              const initialZoom = Math.min(2.2, caps.zoom.max);
              try {
                await track.applyConstraints({ advanced: [{ zoom: initialZoom }] });
                setZoom(initialZoom);
              } catch (e) {}
            }
          }
        }

      } catch (e: any) {
        if (!isMounted) return;
        console.error("Scanner error:", e);
        
        const errorText = e?.message || e?.toString() || "Error desconocido";
        setDebugInfo(errorText);

        if (errorText.includes("Permission") || errorText.includes("NotAllowedError")) {
          setErrorMsg('Permiso de cámara denegado. Por favor, permite el acceso en tu navegador.');
        } else if (errorText.includes("NotFound") || errorText.includes("Requested device not found")) {
          setErrorMsg('No se pudo encontrar la cámara trasera.');
        } else {
          setErrorMsg('Error al iniciar la cámara. Asegúrate de que ninguna otra app la esté usando.');
        }
        setStatus('error');
      }
    };

    const timer = setTimeout(startScanner, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      cleanup();
    };
  }, [isOpen]);

  const handleClose = () => {
    cleanup().then(() => onClose());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black shrink-0 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-white font-bold text-sm tracking-tight">ESCÁNER BRAVOS</span>
        </div>
        <button
          onClick={handleClose}
          className="p-2 rounded-xl bg-white/5 text-white active:scale-90 transition-transform"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Visor de cámara */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {/* Contenedor para html5-qrcode */}
        <div id={videoContainerId} className="w-full h-full" />

        {/* Recuadro guía mejorado */}
        {status === 'scanning' && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="absolute inset-0 bg-black/40" />
              
              <div className="relative z-20 w-[75vw] max-w-[320px] h-[140px]">
                {/* Esquinas Neón */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg shadow-[0_0_15px_#10b981]" />
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg shadow-[0_0_15px_#10b981]" />
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg shadow-[0_0_15px_#10b981]" />
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-lg shadow-[0_0_15px_#10b981]" />
                
                {/* Línea de escaneo láser */}
                <div className="absolute left-1 right-1 h-[3px] bg-emerald-400/90 shadow-[0_0_12px_#10b981] animate-scan-line" />
              </div>
            </div>

            {/* Controles de cámara flotantes */}
            <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-8 px-8 z-20">
              {/* Zoom Slider */}
              {capabilities?.zoom && (
                <div className="w-full max-w-[260px] flex items-center gap-4 bg-black/70 backdrop-blur-2xl px-5 py-4 rounded-3xl border border-white/10 shadow-2xl">
                  <span className="text-white text-[11px] font-black opacity-50">1x</span>
                  <input
                    type="range"
                    min={capabilities.zoom.min}
                    max={capabilities.zoom.max}
                    step={0.1}
                    value={zoom}
                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-white text-[11px] font-black opacity-50">{capabilities.zoom.max.toFixed(0)}x</span>
                </div>
              )}

              {/* Botón Flash */}
              {capabilities?.torch && (
                <button
                  onClick={handleToggleTorch}
                  className={`p-6 rounded-full transition-all duration-300 shadow-2xl active:scale-90 ${
                    torch 
                      ? 'bg-yellow-400 text-black shadow-yellow-400/30' 
                      : 'bg-white/10 text-white border border-white/10 hover:bg-white/20'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill={torch ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}

        {/* Overlay: Cargando */}
        {status === 'loading' && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-[#080B12]">
            <div className="w-16 h-16 border-4 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin" />
            <div className="text-center">
              <p className="text-white font-bold tracking-widest text-xs uppercase">Sincronizando Cámara</p>
              <p className="text-gray-500 text-[10px] mt-1 italic">Solicitando permisos del sistema...</p>
            </div>
          </div>
        )}

        {/* Overlay: Error Crítico */}
        {status === 'error' && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-8 bg-[#080B12] px-10 text-center">
            <div className="w-20 h-20 rounded-[2.5rem] bg-red-500/10 flex items-center justify-center border border-red-500/20">
              <ExclamationTriangleIcon className="w-10 h-10 text-red-500" />
            </div>
            <div>
              <p className="text-white font-bold text-lg">{errorMsg}</p>
              <p className="text-gray-500 text-xs mt-3 leading-relaxed font-mono opacity-50 truncate max-w-xs">{debugInfo}</p>
            </div>
            <div className="flex flex-col w-full gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-emerald-600 text-white text-sm font-black rounded-2xl active:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
              >
                REINTENTAR ACCESO
              </button>
              <button
                onClick={handleClose}
                className="w-full py-4 bg-white/5 text-white/50 text-sm font-bold rounded-2xl active:bg-white/10 transition-colors"
              >
                CERRAR ESCÁNER
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Informativo */}
      {status === 'scanning' && (
        <div className="bg-black px-4 py-8 text-center shrink-0 border-t border-white/5 z-10">
          <p className="text-emerald-400 text-sm font-black tracking-widest uppercase">Listo para Escanear</p>
          <p className="text-gray-500 text-[11px] mt-2 font-medium leading-relaxed">
            Mantén el código dentro del recuadro.<br/>
            El enfoque se ajustará automáticamente.
          </p>
        </div>
      )}
    </div>
  );
}
