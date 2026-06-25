import React from "react";
import { X, ChevronRight, Loader2, Check, Target } from "lucide-react";

export default function ScreenOverlay({ overlayData, stepNumber, isAnalyzing, onNext, onStop }) {
  if (!overlayData) {
    if (isAnalyzing) {
      return (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="bg-zinc-900/90 backdrop-blur rounded-2xl px-6 py-4 flex items-center gap-3 border border-white/10">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-sm text-zinc-300">Analizando pantalla…</span>
          </div>
        </div>
      );
    }
    return null;
  }

  const { bounding_box, instruction, target_description, is_final } = overlayData;
  const box = bounding_box || { x: 40, y: 40, width: 20, height: 15 };

  return (
    <div className="absolute inset-0 z-30">
      <div
        className="absolute border-2 border-blue-400 rounded-lg transition-all duration-500 ease-out"
        style={{
          left: `${box.x}%`,
          top: `${box.y}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 30px rgba(96,165,250,0.5)",
        }}
      >
        <div className="absolute inset-0 border-2 border-blue-300/60 rounded-lg animate-pulse" />
        <div className="absolute -top-9 left-0 bg-blue-500 text-white text-xs font-medium px-2.5 py-1 rounded-md whitespace-nowrap shadow-lg flex items-center gap-1">
          <Target className="w-3 h-3" />
          {target_description || "Hacé clic aquí"}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <div className="bg-zinc-900/95 backdrop-blur-xl border-t border-white/10 p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {is_final ? <Check className="w-4 h-4" /> : stepNumber}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-zinc-100 leading-relaxed">{instruction}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onNext}
              disabled={isAnalyzing}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando…
                </>
              ) : is_final ? (
                <>
                  <Check className="w-4 h-4" />
                  Finalizar
                </>
              ) : (
                <>
                  Siguiente paso
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              onClick={onStop}
              className="flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-400 text-sm px-4 py-2.5 rounded-xl transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}