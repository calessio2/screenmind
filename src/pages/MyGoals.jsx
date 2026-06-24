import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Target, CheckCircle2, Circle, ChevronDown, ChevronRight, Calendar, TrendingUp, ArrowLeft, Award } from "lucide-react";

const getProgress = (goal) => {
  if (!goal.steps || goal.steps.length === 0) return 0;
  const completed = goal.steps.filter(s => s.completed).length;
  return Math.round((completed / goal.steps.length) * 100);
};

export default function MyGoals() {
  const [goals, setGoals] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      base44.entities.Goal.filter({ assigned_to_id: u.id, status: "active" }, "-created_date", 50).then(g => {
        setGoals(g);
        setLoading(false);
      }).catch(() => setLoading(false));
    }).catch(() => setLoading(false));
  }, []);

  const toggleStep = async (goalId, stepIndex) => {
    setToggling(`${goalId}-${stepIndex}`);
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;
    const newSteps = goal.steps.map((s, i) =>
      i === stepIndex ? { ...s, completed: !s.completed } : s
    );
    const allCompleted = newSteps.every(s => s.completed);
    const newStatus = allCompleted ? "completed" : "active";
    await base44.entities.Goal.update(goalId, { steps: newSteps, status: newStatus });
    setGoals(prev => prev.map(g => g.id === goalId ? { ...g, steps: newSteps, status: newStatus } : g));
    setToggling(null);
  };

  const activeGoals = goals.filter(g => g.status === "active");
  const completedGoals = goals.filter(g => g.status === "completed");
  const overallProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + getProgress(g), 0) / goals.length)
    : 0;

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al tutor
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Mis Objetivos</h1>
            <p className="text-xs text-zinc-600">Seguimiento de tu adopción digital</p>
          </div>
        </div>

        {goals.length > 0 && (
          <div className="mt-6 mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Progreso general
              </span>
              <span className="text-lg font-semibold text-zinc-100">{overallProgress}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }} />
            </div>
            <div className="flex gap-4 mt-3 text-[11px]">
              <span className="text-zinc-500">{activeGoals.length} en curso</span>
              <span className="text-zinc-500 flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-500" />
                {completedGoals.length} completados
              </span>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-zinc-700" />
            </div>
            <p className="text-zinc-400 text-sm mb-1">No tenés objetivos asignados todavía</p>
            <p className="text-zinc-600 text-xs">Tu administrador asignará objetivos de adopción digital pronto.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const progress = getProgress(goal);
              const isExpanded = expandedId === goal.id;
              const isCompleted = goal.status === "completed";
              return (
                <div key={goal.id} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-zinc-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className={`text-sm font-medium truncate ${isCompleted ? "text-zinc-500 line-through" : "text-zinc-200"}`}>
                          {goal.title}
                        </h3>
                        <span className="text-xs text-zinc-500 flex-shrink-0">{progress}%</span>
                      </div>
                      {goal.description && <p className="text-xs text-zinc-600 mb-2 line-clamp-1">{goal.description}</p>}
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {goal.category && <span className="text-[10px] text-zinc-600">{goal.category}</span>}
                        {goal.due_date && (
                          <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {new Date(goal.due_date).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                          </span>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-1" /> : <ChevronRight className="w-4 h-4 text-zinc-600 flex-shrink-0 mt-1" />}
                  </button>

                  {isExpanded && goal.steps && goal.steps.length > 0 && (
                    <div className="px-4 pb-4 pl-12 space-y-1">
                      {goal.steps.map((step, i) => (
                        <button
                          key={i}
                          onClick={() => toggleStep(goal.id, i)}
                          disabled={toggling === `${goal.id}-${i}`}
                          className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.03] transition-colors text-left disabled:opacity-50"
                        >
                          {step.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-4 h-4 text-zinc-700 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs ${step.completed ? "text-zinc-600 line-through" : "text-zinc-300"}`}>
                              {step.title}
                            </p>
                            {step.description && (
                              <p className="text-[11px] text-zinc-600 mt-0.5">{step.description}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}