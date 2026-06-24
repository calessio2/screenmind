import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ProcessForm({ open, onClose, onSaved, editingProcess }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [software, setSoftware] = useState("");
  const [category, setCategory] = useState("");
  const [keywords, setKeywords] = useState("");
  const [steps, setSteps] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploadingStep, setUploadingStep] = useState(null);

  useEffect(() => {
    if (editingProcess) {
      setTitle(editingProcess.title || "");
      setDescription(editingProcess.description || "");
      setSoftware(editingProcess.software || "");
      setCategory(editingProcess.category || "");
      setKeywords(editingProcess.keywords || "");
      setSteps(editingProcess.steps?.length ? editingProcess.steps : [{ title: "", description: "", image_url: "" }]);
    } else {
      setTitle("");
      setDescription("");
      setSoftware("");
      setCategory("");
      setKeywords("");
      setSteps([{ title: "", description: "", image_url: "" }]);
    }
  }, [editingProcess, open]);

  const addStep = () => {
    setSteps([...steps, { title: "", description: "", image_url: "" }]);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index, field, value) => {
    setSteps(steps.map((s, i) => i === index ? { ...s, [field]: value } : s));
  };

  const handleImageUpload = async (index, file) => {
    setUploadingStep(index);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      updateStep(index, "image_url", file_url);
    } catch (err) {
      // ignore
    } finally {
      setUploadingStep(null);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const data = {
        title: title.trim(),
        description: description.trim(),
        software: software.trim(),
        category: category.trim(),
        keywords: keywords.trim(),
        steps: steps.filter(s => s.title?.trim() || s.description?.trim()),
        status: "active",
      };
      if (editingProcess) {
        await base44.entities.Process.update(editingProcess.id, data);
      } else {
        await base44.entities.Process.create(data);
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
            {editingProcess ? "Editar proceso" : "Nuevo proceso"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Solicitar vacaciones en el sistema"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Software</label>
              <input
                value={software}
                onChange={(e) => setSoftware(e.target.value)}
                placeholder="Ej: SAP, Excel, Salesforce"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Categoría</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: RRHH, Finanzas"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descripción del proceso"
              rows={2}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Palabras clave</label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="vacaciones, ausencia, rrhh, permiso"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600/50"
            />
            <p className="text-[10px] text-zinc-600 mt-1">Separadas por comas, ayudan al tutor a encontrar el proceso correcto</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-zinc-400">Pasos del proceso</label>
              <Button size="sm" variant="ghost" onClick={addStep} className="text-blue-400 hover:text-blue-300 hover:bg-zinc-800 h-7 text-xs">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Agregar paso
              </Button>
            </div>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={index} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] text-zinc-300 flex-shrink-0">{index + 1}</span>
                    <input
                      value={step.title || ""}
                      onChange={(e) => updateStep(index, "title", e.target.value)}
                      placeholder="Título del paso"
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
                    placeholder="Instrucción detallada del paso"
                    rows={2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-600/50 resize-none"
                  />
                  <div className="flex items-center gap-2">
                    {step.image_url && (
                      <img src={step.image_url} alt="step" className="w-12 h-12 rounded object-cover border border-zinc-700" />
                    )}
                    <label className="cursor-pointer flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 hover:bg-zinc-700 transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      {uploadingStep === index ? "Subiendo..." : step.image_url ? "Cambiar imagen" : "Subir imagen"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleImageUpload(index, file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || saving} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "Guardando..." : "Guardar proceso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}