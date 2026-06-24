import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Plus, Trash2, Pencil, Target, ArrowLeft, Users, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import GoalForm from "@/components/screen-agent/GoalForm";

const getProgress = (goal) => {
  if (!goal.steps || goal.steps.length === 0) return 0;
  const completed = goal.steps.filter(s => s.completed).length;
  return Math.round((completed / goal.steps.length) * 100);
};

export default function GoalManagement() {
  const [goals, setGoals] = useState([]);
  const [users, setUsers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const loadData = async () => {
    try {
      const u = await base44.auth.me();
      setUser(u);
      if (u.role !== "admin") {
        setLoading(false);
        return;
      }
      const [allGoals, allUsers] = await Promise.all([
        base44.entities.Goal.list("-created_date", 100),
        base44.entities.User.list()
      ]);
      setGoals(allGoals);
      setUsers(allUsers);
    } catch (err) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id) => {
    await base44.entities.Goal.delete(id);
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleNew = () => {
    setEditingGoal(null);
    setFormOpen(true);
  };

  const handleEdit = (goal) => {
    setEditingGoal(goal);
    setFormOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-8 h-8 border-4 border-zinc-800 border-t-zinc-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
            <ShieldAlert className="w-6 h-6 text-red-400" />
          </div>
          <p className="text-zinc-300 text-sm font-medium mb-1">Acceso restringido</p>
          <p className="text-zinc-600 text-xs mb-4">Solo los administradores pueden gestionar objetivos.</p>
          <Link to="/" className="text-xs text-zinc-500 hover:text-zinc-300">Volver al tutor</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al tutor
        </Link>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <Target className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">Gestión de Objetivos</h1>
              <p className="text-xs text-zinc-600">Asigná y gestioná objetivos de adopción digital</p>
            </div>
          </div>
          <Button onClick={handleNew} className="bg-white text-zinc-950 hover:bg-zinc-200 text-sm">
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo objetivo
          </Button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-zinc-700" />
            </div>
            <p className="text-zinc-400 text-sm mb-1">No hay objetivos creados</p>
            <p className="text-zinc-600 text-xs">Creá el primer objetivo de adopción digital.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {goals.map(goal => {
              const progress = getProgress(goal);
              const isCompleted = goal.status === "completed";
              return (
                <div key={goal.id} className="group flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <span className="text-xs text-emerald-400 font-semibold">{progress}%</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                        <span className="text-xs text-amber-400 font-semibold">{progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-zinc-200 truncate">{goal.title}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" />
                        {goal.assigned_to_name || "Sin asignar"}
                      </span>
                      {goal.category && <span className="text-[11px] text-zinc-600">{goal.category}</span>}
                      <span className="text-[11px] text-zinc-600">{goal.steps?.length || 0} pasos</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(goal)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(goal.id)} className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-500 hover:text-red-400 hover:bg-red-950/30">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <GoalForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={loadData}
        editingGoal={editingGoal}
        users={users}
      />
    </div>
  );
}