import React from "react";
import GuideViewer from "./GuideViewer";
import ScreenPreview from "./ScreenPreview";
import InteractiveContentViewer from "@/components/interactive/InteractiveContentViewer";
import { BookOpen, Monitor, Sparkles, Youtube, MousePointerClick, FileText, GitFork } from "lucide-react";

export default function DynamicPanel({ mode, process, stepIndex, onStepChange, stream, isSharing, screenshotRequested, onStartSharing, onStopSharing, onCapture, isCapturing, guidedMode, overlayStep, guidedStepNumber, isAnalyzingStep, onStartGuidedMode, onNextGuidedStep, onStopGuidedMode, interactiveContent, onSimulationEvent }) {
  if (mode === "guide" && process) {
    return <GuideViewer process={process} stepIndex={stepIndex} onStepChange={onStepChange} />;
  }

  if (mode === "interactive" && interactiveContent) {
    return <InteractiveContentViewer content={interactiveContent} onProgress={onSimulationEvent} />;
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
        guidedMode={guidedMode}
        overlayStep={overlayStep}
        guidedStepNumber={guidedStepNumber}
        isAnalyzingStep={isAnalyzingStep}
        onStartGuidedMode={onStartGuidedMode}
        onNextGuidedStep={onNextGuidedStep}
        onStopGuidedMode={onStopGuidedMode}
      />
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full bg-zinc-950 p-6">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
        <Sparkles className="w-7 h-7 text-zinc-700" />
      </div>
      <h3 className="text-zinc-300 font-medium text-sm mb-2">Panel del Tutor</h3>
      <p className="text-zinc-600 text-xs text-center max-w-xs leading-relaxed">
        Las guías visuales y capturas de pantalla aparecerán aquí. Escribí tu consulta en el chat para comenzar.
      </p>
      <div className="flex flex-wrap justify-center gap-6 mt-10 max-w-md">
        {[
          { icon: BookOpen, label: "Guías visuales" },
          { icon: Monitor, label: "Pantalla en vivo" },
          { icon: Youtube, label: "Videos explicativos" },
          { icon: MousePointerClick, label: "Simuladores" },
          { icon: FileText, label: "Actividades drag and drop" },
          { icon: Sparkles, label: "Tests" },
          { icon: GitFork, label: "Casos" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
              <item.icon className="w-5 h-5 text-zinc-700" />
            </div>
            <span className="text-[10px] text-zinc-700">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}