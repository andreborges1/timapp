"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { Camera, CameraOff } from "lucide-react";

interface QRScannerProps {
  onScan: (code: string) => void;
  active?: boolean;
}

export function QRScanner({ onScan, active = true }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const cooldownRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    const reader = new BrowserMultiFormatReader();
    let stopped = false;

    async function start() {
      try {
        setError(null);
        setScanning(true);
        await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
          if (stopped || cooldownRef.current) return;
          if (result) {
            cooldownRef.current = true;
            onScan(result.getText());
            setTimeout(() => { cooldownRef.current = false; }, 3000);
          }
        });
      } catch (e: any) {
        if (!stopped) {
          if (e.name === "NotAllowedError") {
            setError("Camera permission denied. Please allow camera access.");
          } else {
            setError("Could not access camera. Try the manual input instead.");
          }
          setScanning(false);
        }
      }
    }

    start();

    return () => {
      stopped = true;
      BrowserMultiFormatReader.releaseAllStreams();
      setScanning(false);
    };
  }, [active, onScan]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 bg-slate-100 rounded-xl border-2 border-dashed border-slate-300 text-center">
        <CameraOff size={32} className="text-slate-400" />
        <p className="text-sm text-slate-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden bg-black">
      <video
        ref={videoRef}
        className="w-full aspect-square object-cover"
        autoPlay
        muted
        playsInline
      />
      {/* Scanning overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-48 h-48">
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-white rounded-tl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-white rounded-tr" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-white rounded-bl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-white rounded-br" />
          {/* Scan line */}
          {scanning && (
            <div className="absolute left-1 right-1 h-0.5 bg-blue-400 opacity-80 animate-[scan_2s_ease-in-out_infinite]" />
          )}
        </div>
      </div>
      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
      `}</style>
      <p className="text-center text-white text-xs py-2 bg-black/50">Point camera at QR code</p>
    </div>
  );
}
