import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function GoalForm({ open, onClose, onSaved, editingGoal, users }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [assignedToName, setAssignedToName] = useState("");
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [interactiveContents, setInteractiveContents] = useState([]);

  useEffect(() => {
    base44.entities.InteractiveContent.filter({ status: "active" }).then(setInteractiveContents).catch(() => {});
  }, []);

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title || "");
      setDescription(editingGoal.description || "");
      setCategory(editingGoal.category || "");
      setDueDate(editingGoal.due_date || "");
      setAssignedToId(editingGoal.assigned_to_id || "");
      setAssignedToName(editingGoal.assigned_to_name || "");
      setSteps(editingGoal.steps?.length ? editingGoal.steps : []);
    } else {
      setTitle("");
      setDescription("");
      setCategory("");
      setDueDate("");
      setAssignedToId("");
      setAssignedToName("");
      setSteps([]);
    }
  }, [editingGoal, open]);

  const addStep = () => {
    setSteps([...steps, { title: "", description: "", completed: false, linked_content_id: "", target_count: 1, current_count: 0 }]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    setSteps(steps.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleUserChange = (e) => {
    const id = e.target.value;
    const user = users?.find(u => u.id === id);
    setAssignedToId(id);
    setAssignedToName(user?.full_name || user?.email || "");
  };

  const handleGenerateSteps = async () => {
    if (!title.trim()) return;
    setGenerating(true);
    try {
      const prompt = `Sos un experto en adopción digital. Un administrador quiere crear un objetivo de capacitación con el título: "${title.trim()}"${description.trim() ? ` y descripción: "${description.trim()}"` : ""}.

Generá los hitos necesarios para que un usuario cumpla este objetivo. Cada hito debe ser una acción concreta y verificable, y puede requerir múltiples repeticiones.

Respondé en español argentino, en formato JSON con esta estructura exacta:
{"steps": [{"title": "título corto del hito", "description": "instrucción detallada", "target_count": 1}]}

Generá entre 3 y 6 hitos, ordenados lógicamente. Usá target_count > 1 solo cuando el hito naturalmente requiere repetición (ej: practicar 3 veces, enviar 2 emails). No incluyas hitos genéricos como "practicar" o "repasar".`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  target_count: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (result?.steps?.length) {
        setSteps(result.steps.map(s => ({ title: s.title, description: s.description, completed: false, linked_content_id: "", target_count: s.target_count || 1, current_count: 0 })));
      }
    } catch (err) {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !assignedToId) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        due_date: dueDate || undefined,
        assigned_to_id: assignedToId,
        assigned_to_name: assignedToName,
        steps: steps.filter(s => s.title?.trim()).map(s => ({
          title: s.title,
          description: s.description,
          linked_content_id: s.linked_content_id || undefined,
          target_count: s.target_count || 1,
          current_count: s.current_count || 0,
          completed: (s.current_count || 0) >= (s.target_count || 1),
        })),
        status: editingGoal?.status || "active",
      };
      if (editingGoal) {
        await base44.entities.Goal.update(editingGoal.id, data);
      } else {
        await base44.entities.Goal.create(data);
      }
      onSaved();
      onClose();
    } catch (err) {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">
            {editingGoal ? "Editar objetivo" : "Nuevo objetivo de adopción"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Imprimir historia clínica en Geclisa"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Asignar a *</label>
            <select
              value={assignedToId}
              onChange={handleUserChange}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            >
              <option value="">Seleccionar usuario...</option>
              {users?.map(u => (
                <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Categoría</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: RRHH, Finanzas"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Fecha límite</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: El usuario debe poder localizar e imprimir la historia clínica de un paciente desde el sistema Geclisa"
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-400">Hitos del objetivo</label>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleGenerateSteps}
                  disabled={!title.trim() || generating}
                  className="text-amber-400 hover:text-amber-300 hover:bg-zinc-800 h-7 text-xs"
                >
                  {generating ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
                  {generating ? "Generando..." : "Generar hitos con IA"}
                </Button>
                <Button size="sm" variant="ghost" onClick={addStep} className="text-blue-400 hover:text-blue-300 hover:bg-zinc-800 h-7 text-xs">
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar hito
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 flex-shrink-0">{index + 1}</span>
                    <input
                      value={step.title || ""}
                      onChange={(e) => updateStep(index, "title", e.target.value)}
                      placeholder="Título del hito"
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600/50"
                    />
                    {steps.length > 1 && (
                      <button onClick={() => removeStep(index)} className="text-zinc-500 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={step.description || ""}
                    onChange={(e) => updateStep(index, "description", e.target.value)}
                    placeholder="Descripción o instrucción del hito"
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600/50 resize-none"
                  />
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <label className="text-[10px] text-zinc-500 whitespace-nowrap">Actividad:</label>
                      <select
                        value={step.linked_content_id || ""}
                        onChange={(e) => updateStep(index, "linked_content_id", e.target.value)}
                        className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-600/50"
                      >
                        <option value="">Manual</option>
                        {interactiveContents.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.type === "email_simulator" ? "📧" : c.type === "youtube" ? "🎬" : c.type === "drag_drop_game" ? "🎯" : "💻"} {c.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] text-zinc-500 whitespace-nowrap">Repeticiones:</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={step.target_count || 1}
                        onChange={(e) => updateStep(index, "target_count", Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-14 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs text-zinc-100 text-center focus:outline-none focus:ring-1 focus:ring-blue-600/50"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {steps.length === 0 && (
                <p className="text-[11px] text-zinc-600 text-center py-4">Agregá hitos para definir cómo se cumple este objetivo.</p>
              )}
            </div>
            <p className="text-[10px] text-zinc-600 mt-2">Vinculá un hito a una actividad para que acumule progreso automáticamente cuando el usuario la realice. Configurá repeticiones si el hito requiere realizar la acción varias veces.</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !assignedToId || saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "Guardando..." : "Guardar objetivo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}