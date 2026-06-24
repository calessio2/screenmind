import React from "react";
import { ChevronLeft, ChevronRight, BookOpen, ImageOff } from "lucide-react";

export default function GuideViewer({ process, stepIndex, onStepChange }) {
  if (!process || !process.steps || process.steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 rounded-xl">
        <BookOpen className="w-10 h-10 text-zinc-600 mb-3" />
        <p className="text-zinc-500 text-sm">Esta guía no tiene pasos definidos</p>
      </div>
    );
  }

  const steps = process.steps;
  const step = steps[stepIndex] || steps[0];

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl overflow-hidden">
      <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-zinc-100 truncate">{process.title}</h3>
        </div>
        <p className="text-[11px] text-zinc-500">
          Paso {stepIndex + 1} de {steps.length}
          {process.software && <span> · {process.software}</span>}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {step.image_url ? (
          <img src={step.image_url} alt={step.title} className="w-full object-contain bg-black" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] bg-zinc-900/30 p-8">
            <ImageOff className="w-10 h-10 text-zinc-700 mb-2" />
            <p className="text-zinc-600 text-xs">Sin imagen para este paso</p>
          </div>
        )}
        <div className="p-4">
          {step.title && <h4 className="text-sm font-medium text-zinc-200 mb-1.5">{step.title}</h4>}
          {step.description && <p className="text-xs text-zinc-400 leading-relaxed">{step.description}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900/80 border-t border-zinc-800">
        <button
          onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
          disabled={stepIndex === 0}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => onStepChange(i)}
              className={`w-2 h-2 rounded-full transition-colors ${i === stepIndex ? 'bg-emerald-500' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            />
          ))}
        </div>
        <button
          onClick={() => onStepChange(Math.min(steps.length - 1, stepIndex + 1))}
          disabled={stepIndex === steps.length - 1}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}