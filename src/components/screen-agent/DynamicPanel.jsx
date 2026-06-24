import React from "react";
import GuideViewer from "./GuideViewer";
import ScreenPreview from "./ScreenPreview";
import { BookOpen, Monitor, Sparkles } from "lucide-react";

export default function DynamicPanel({ mode, process, stepIndex, onStepChange, stream, isSharing, screenshotRequested, onStartSharing, onStopSharing, onCapture, isCapturing }) {
  if (mode === "guide" && process) {
    return <GuideViewer process={process} stepIndex={stepIndex} onStepChange={onStepChange} />;
  }

  if (mode === "screen") {
    return (
      <ScreenPreview
        stream={stream}
        isSharing={isSharing}
        screenshotRequested={screenshotRequested}
        onStartSharing={onStartSharing}
        onStopSharing={onStopSharing}
        onCapture={onCapture}
        isCapturing={isCapturing}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-zinc-900 to-zinc-950 rounded-xl p-6">
      <div className="w-20 h-20 rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-zinc-500" />
      </div>
      <h3 className="text-zinc-300 font-medium text-sm mb-2">Panel del Tutor</h3>
      <p className="text-zinc-500 text-xs text-center max-w-xs leading-relaxed">
        Las guías visuales y capturas de pantalla aparecerán aquí. Escribí tu consulta en el chat para comenzar.
      </p>
      <div className="flex gap-6 mt-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/60 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-zinc-500" />
          </div>
          <span className="text-[10px] text-zinc-600">Guías visuales</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-xl bg-zinc-800/60 flex items-center justify-center">
            <Monitor className="w-6 h-6 text-zinc-500" />
          </div>
          <span className="text-[10px] text-zinc-600">Pantalla en vivo</span>
        </div>
      </div>
    </div>
  );
}