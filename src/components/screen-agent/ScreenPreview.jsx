import React, { useState, useEffect, useRef } from "react";
import { Monitor, MonitorOff, Camera, ShieldCheck, ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import ScreenOverlay from "./ScreenOverlay";

export default function ScreenPreview({ stream, isSharing, screenshotRequested, onStartSharing, onStopSharing, onCapture, isCapturing, guidedMode, overlayStep, guidedStepNumber, isAnalyzingStep, onStartGuidedMode, onNextGuidedStep, onStopGuidedMode }) {
  const videoRef = useRef(null);
  const [aspectRatio, setAspectRatio] = useState(1.78);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video?.videoWidth && video?.videoHeight) {
      setAspectRatio(video.videoWidth / video.videoHeight);
    }
  };

  if (!isSharing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950">
        {screenshotRequested && (
          <div className="mb-5 px-4 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-400 text-xs text-center">
              📸 El tutor solicitó ver tu pantalla
            </p>
          </div>
        )}
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
          <Monitor className="w-7 h-7 text-zinc-700" />
        </div>
        <p className="text-zinc-400 text-sm mb-2 text-center max-w-xs">
          {screenshotRequested
            ? "Compartí tu pantalla para que el tutor pueda ver lo que estás haciendo y guiarte."
            : "Compartí tu pantalla para recibir asistencia en tiempo real."}
        </p>
        <div className="flex items-center gap-1.5 mb-6">
          <ShieldCheck className="w-3.5 h-3.5 text-zinc-700" />
          <span className="text-[10px] text-zinc-700">Las capturas no se guardan en la base de datos</span>
        </div>
        <Button
          onClick={onStartSharing}
          className="bg-white text-zinc-950 hover:bg-zinc-200 px-6 py-2.5 rounded-xl font-medium"
        >
          <Monitor className="w-4 h-4 mr-2" />
          Compartir pantalla
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-zinc-400 font-medium">Pantalla en vivo</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onStartGuidedMode}
            disabled={guidedMode || isAnalyzingStep}
            className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 text-xs h-7 px-2"
          >
            <ScanLine className="w-3.5 h-3.5 mr-1" />
            Modo guiado
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onCapture}
            disabled={isCapturing}
            className="text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04] text-xs h-7 px-2"
          >
            <Camera className="w-3.5 h-3.5 mr-1" />
            {isCapturing ? "Analizando..." : "Capturar"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onStopSharing}
            className="text-red-400 hover:text-red-300 hover:bg-red-950/40 text-xs h-7 px-2"
          >
            <MonitorOff className="w-3.5 h-3.5 mr-1" />
            Detener
          </Button>
        </div>
      </div>
      <div className="flex-1 relative bg-black flex items-center justify-center p-2 overflow-hidden">
        <div className="relative max-w-full max-h-full" style={{ aspectRatio: `${aspectRatio}` }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={handleLoadedMetadata}
            className="w-full h-full rounded-lg object-contain"
          />
          {guidedMode && (
            <ScreenOverlay
              overlayData={overlayStep}
              stepNumber={guidedStepNumber}
              isAnalyzing={isAnalyzingStep}
              onNext={onNextGuidedStep}
              onStop={onStopGuidedMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}