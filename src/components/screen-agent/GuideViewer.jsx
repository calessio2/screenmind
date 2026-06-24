import React from "react";
import { ChevronLeft, ChevronRight, BookOpen, ImageOff } from "lucide-react";

export default function GuideViewer({ process, stepIndex, onStepChange }) {
  if (!process || !process.steps || process.steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950">
        <BookOpen className="w-8 h-8 text-zinc-700 mb-3" />
        <p className="text-zinc-600 text-sm">Esta guía no tiene pasos definidos</p>
      </div>
    );
  }

  const steps = process.steps;
  const currentStep = typeof stepIndex === "number" ? stepIndex : 0;
  const step = steps[currentStep] || steps[0];

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="w-4 h-4 text-zinc-500" />
          <h3 className="text-sm font-medium text-zinc-100 truncate">{process.title}</h3>
        </div>
        <p className="text-[11px] text-zinc-600">
          Paso {currentStep + 1} de {steps.length}
          {process.software && <span> · {process.software}</span>}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {step.image_url ? (
          <img src={step.image_url} alt={step.title} className="w-full object-contain bg-black" />
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] p-8">
            <ImageOff className="w-8 h-8 text-zinc-800 mb-2" />
            <p className="text-zinc-700 text-xs">Sin imagen para este paso</p>
          </div>
        )}
        <div className="p-4">
          {step.title && <h4 className="text-sm font-medium text-zinc-200 mb-1.5">{step.title}</h4>}
          {step.description && <p className="text-xs text-zinc-500 leading-relaxed">{step.description}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <button
              type="button"
              key={i}
              onClick={() => onStepChange(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentStep ? 'bg-white' : 'bg-zinc-800 hover:bg-zinc-700'}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => onStepChange(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
        >
          Siguiente
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}