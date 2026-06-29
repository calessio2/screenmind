import React, { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { XCircle, RotateCcw, Trophy, Star } from "lucide-react";

export default function SimulationFeedback({ type, errors, onComplete, onRetry }) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (type === "success" && !firedRef.current) {
      firedRef.current = true;
      const duration = 3000;
      const end = Date.now() + duration;
      const colors = ["#22c55e", "#3b82f6", "#eab308", "#a855f7"];

      (function frame() {
        confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors });
        confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors });
        if (Date.now() < end) requestAnimationFrame(frame);
      })();

      // Big burst from center
      setTimeout(() => {
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 }, colors });
      }, 200);
    }
  }, [type]);

  if (type === "success") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm z-50 px-6">
        <div className="text-center max-w-sm">
          <div className="relative w-28 h-28 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/20 border-2 border-green-500/50 animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Trophy className="w-14 h-14 text-green-400" />
            </div>
            <Star className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 fill-yellow-400" />
            <Star className="w-4 h-4 text-yellow-400 absolute top-2 -left-2 fill-yellow-400" />
            <Star className="w-3 h-3 text-yellow-400 absolute -bottom-1 right-4 fill-yellow-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">¡Excelente!</h2>
          <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
            Completaste la tarea correctamente. ¡Seguí practicando para seguir mejorando!
          </p>
          <button
            onClick={onComplete}
            className="bg-green-500 hover:bg-green-400 text-white font-medium px-8 py-3 rounded-xl transition-colors text-sm"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/95 backdrop-blur-sm z-50 px-6">
      <div className="text-center max-w-md w-full">
        <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mb-5">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">¡Casi lo lográs!</h2>
        <p className="text-zinc-400 text-sm mb-5">Revisá estos puntos e intentá de nuevo:</p>
        <div className="space-y-2 mb-8 text-left">
          {errors.map((err, i) => (
            <div
              key={i}
              className="flex items-start gap-2.5 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5"
            >
              <span className="text-red-400 text-sm font-bold mt-0.5">!</span>
              <span className="text-zinc-300 text-xs leading-relaxed">{err}</span>
            </div>
          ))}
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 font-medium px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          <RotateCcw className="w-4 h-4" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}