import React from "react";
import { ListChecks, CheckCircle2, Circle } from "lucide-react";

export default function TaskSteps({ description, steps, completedSteps = [] }) {
  const total = steps.length;
  const done = completedSteps.length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="border-t border-white/[0.06] bg-zinc-900/60 flex-shrink-0">
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="text-sm font-medium text-zinc-200">Tu tarea</span>
          <span className="ml-auto text-[10px] text-zinc-600 font-medium">
            {done}/{total}
          </span>
        </div>

        {description && (
          <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
        )}

        {total > 1 && (
          <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="space-y-1">
          {steps.map((step, i) => {
            const isDone = completedSteps.includes(i);
            return (
              <div key={i} className="flex items-start gap-2">
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-zinc-600 mt-0.5 flex-shrink-0" />
                )}
                <span
                  className={`text-xs leading-relaxed transition-colors ${
                    isDone ? "text-zinc-600 line-through" : "text-zinc-400"
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}