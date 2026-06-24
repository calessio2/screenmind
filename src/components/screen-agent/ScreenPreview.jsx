import React from "react";
import { Monitor, MonitorOff, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ScreenPreview({ stream, latestScreenshot, isSharing, onStartSharing, onStopSharing, onCapture, isCapturing }) {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!isSharing) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl">
        <div className="w-20 h-20 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-6">
          <Monitor className="w-10 h-10 text-zinc-500" />
        </div>
        <p className="text-zinc-400 text-sm mb-6 text-center max-w-xs">
          Compartí tu pantalla para que el agente pueda ver lo que estás haciendo y guiarte paso a paso.
        </p>
        <Button
          onClick={onStartSharing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium"
        >
          <Monitor className="w-4 h-4 mr-2" />
          Compartir pantalla
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-zinc-400 font-medium">Pantalla en vivo</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCapture}
            disabled={isCapturing}
            className="text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs h-7 px-2"
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
      <div className="flex-1 relative bg-black flex items-center justify-center p-2">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="max-w-full max-h-full rounded-lg object-contain"
        />
      </div>
    </div>
  );
}