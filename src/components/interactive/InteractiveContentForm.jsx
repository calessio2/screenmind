import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save, Loader2 } from "lucide-react";

const typeOptions = [
  { value: "youtube", label: "Video de YouTube" },
  { value: "email_simulator", label: "Simulador de Email" },
  { value: "drag_drop_game", label: "Juego Drag & Drop" },
];

export default function InteractiveContentForm({ content, onClose, onSaved }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("youtube");
  const [category, setCategory] = useState("");
  const [software, setSoftware] = useState("");
  const [keywords, setKeywords] = useState("");
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (content) {
      setTitle(content.title || "");
      setDescription(content.description || "");
      setType(content.type || "youtube");
      setCategory(content.category || "");
      setSoftware(content.software || "");
      setKeywords(content.keywords || "");
      setConfig(content.config || {});
    } else {
      setConfig({ youtube_id: "" });
    }
  }, [content]);

  const updateConfig = (key, value) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateEmailScenario = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      email_scenario: { ...(prev.email_scenario || {}), [key]: value }
    }));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        type,
        category: category.trim(),
        software: software.trim(),
        keywords: keywords.trim(),
        config,
        status: "active",
      };
      if (content?.id) {
        await base44.entities.InteractiveContent.update(content.id, payload);
      } else {
        await base44.entities.InteractiveContent.create(payload);
      }
      onSaved();
    } catch (err) {
      alert("Error al guardar: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] sticky top-0 bg-zinc-900 z-10">
          <h2 className="text-sm font-medium text-zinc-200">
            {content ? "Editar contenido" : "Nuevo contenido interactivo"}
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Título *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Enviar email con copia oculta"
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qué enseña o practica este contenido"
              rows={2}
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12] resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Tipo</label>
              <select
                value={type}
                onChange={(e) => {
                  const newType = e.target.value;
                  setType(newType);
                  if (newType === "youtube") setConfig({ youtube_id: "" });
                  else if (newType === "email_simulator") setConfig({ email_scenario: { to: "", subject: "", body: "", show_cco: false, target_action: "" } });
                  else if (newType === "drag_drop_game") setConfig({ game_items: [], zones: [] });
                }}
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-white/[0.12]"
              >
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Categoría</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ej: Email"
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Software</label>
              <input
                type="text"
                value={software}
                onChange={(e) => setSoftware(e.target.value)}
                placeholder="Ej: Gmail"
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-400 mb-1.5 block">Palabras clave (separadas por comas)</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="email, copia oculta, cco, gmail"
              className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
            />
          </div>

          <div className="border-t border-white/[0.06] pt-4">
            <p className="text-xs font-medium text-zinc-400 mb-3">Configuración específica</p>

            {type === "youtube" && (
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Link del video de YouTube</label>
                <input
                  type="text"
                  value={config.youtube_id || ""}
                  onChange={(e) => updateConfig("youtube_id", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
                />
              </div>
            )}

            {type === "email_simulator" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Destinatario esperado (Para)</label>
                  <input
                    type="text"
                    value={config.email_scenario?.to || ""}
                    onChange={(e) => updateEmailScenario("to", e.target.value)}
                    placeholder="destinatario@ejemplo.com"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Asunto esperado</label>
                  <input
                    type="text"
                    value={config.email_scenario?.subject || ""}
                    onChange={(e) => updateEmailScenario("subject", e.target.value)}
                    placeholder="Asunto del email"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Cuerpo esperado</label>
                  <textarea
                    value={config.email_scenario?.body || ""}
                    onChange={(e) => updateEmailScenario("body", e.target.value)}
                    placeholder="Texto del cuerpo..."
                    rows={3}
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12] resize-none"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.email_scenario?.show_cco || false}
                    onChange={(e) => updateEmailScenario("show_cco", e.target.checked)}
                    className="w-4 h-4 accent-blue-500"
                  />
                  <span className="text-xs text-zinc-300">Requiere copia oculta (CCO)</span>
                </label>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Tarea / objetivo</label>
                  <input
                    type="text"
                    value={config.email_scenario?.target_action || ""}
                    onChange={(e) => updateEmailScenario("target_action", e.target.value)}
                    placeholder="Ej: Enviar el email con copia oculta"
                    className="w-full bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
                  />
                </div>
              </div>
            )}

            {type === "drag_drop_game" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Zonas (destinos)</label>
                  {(config.zones || []).map((zone, i) => (
                    <div key={i} className="flex gap-2 mb-1.5">
                      <input
                        type="text"
                        value={zone.label}
                        onChange={(e) => {
                          const zones = [...(config.zones || [])];
                          zones[i] = { ...zones[i], label: e.target.value };
                          updateConfig("zones", zones);
                        }}
                        placeholder="Nombre de la zona"
                        className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
                      />
                      <button
                        onClick={() => updateConfig("zones", (config.zones || []).filter((_, idx) => idx !== i))}
                        className="text-zinc-600 hover:text-red-400 px-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateConfig("zones", [...(config.zones || []), { id: `zone_${Date.now()}`, label: "" }])}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    + Agregar zona
                  </button>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 mb-1.5 block">Elementos</label>
                  {(config.game_items || []).map((item, i) => (
                    <div key={i} className="flex gap-2 mb-1.5">
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => {
                          const items = [...(config.game_items || [])];
                          items[i] = { ...items[i], label: e.target.value };
                          updateConfig("game_items", items);
                        }}
                        placeholder="Etiqueta del elemento"
                        className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12]"
                      />
                      <select
                        value={item.correct_zone || ""}
                        onChange={(e) => {
                          const items = [...(config.game_items || [])];
                          items[i] = { ...items[i], correct_zone: e.target.value };
                          updateConfig("game_items", items);
                        }}
                        className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-2 py-2 text-sm text-zinc-100 focus:outline-none focus:border-white/[0.12]"
                      >
                        <option value="">Zona correcta</option>
                        {(config.zones || []).map((z) => (
                          <option key={z.id} value={z.id}>{z.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => updateConfig("game_items", (config.game_items || []).filter((_, idx) => idx !== i))}
                        className="text-zinc-600 hover:text-red-400 px-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => updateConfig("game_items", [...(config.game_items || []), { id: `item_${Date.now()}`, label: "", correct_zone: "" }])}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    + Agregar elemento
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-white/[0.06] sticky bottom-0 bg-zinc-900">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="flex items-center gap-2 bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-30 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}