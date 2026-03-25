"use client";

import { useRef } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
}

export function QRCodeDisplay({ value, size = 200 }: QRCodeDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  function handleDownload() {
    const svg = containerRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const link = document.createElement("a");
      link.download = "timapp-qr-code.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        ref={containerRef}
        className="p-4 bg-white rounded-2xl border-2 border-slate-200 shadow-sm"
      >
        <QRCode value={value} size={size} />
      </div>
      <p className="text-xs text-slate-400 font-mono break-all text-center max-w-xs">{value}</p>
      <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
        <Download size={14} />
        Download QR Code
      </Button>
    </div>
  );
}
