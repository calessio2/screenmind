import React, { useState } from "react";
import { Play, Settings, Check, AlertCircle, RotateCcw } from "lucide-react";
import SimulationFeedback from "./SimulationFeedback";

const STEPS = [
  { id: "settings", label: "Abrí Configuración (ícono de engranaje ⚙️)" },
  { id: "see_all", label: "Hacé clic en «Ver toda la configuración»" },
  { id: "general_tab", label: "Asegurate de estar en la pestaña «General»" },
  { id: "signature_section", label: "Bajá hasta la sección «Firma»" },
  { id: "create_sig", label: "Hacé clic en «Crear nueva firma»" },
  { id: "fill_sig", label: "Escribí tu firma con nombre, cargo y contacto" },
  { id: "save", label: "Hacé clic en «Guardar cambios»" },
];

export default function SignatureSimulator({ content, onProgress }) {
  const [started, setStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [allSettingsOpen, setAllSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [signatureSectionVisible, setSignatureSectionVisible] = useState(false);
  const [createSigOpen, setCreateSigOpen] = useState(false);
  const [sigName, setSigName] = useState("");
  const [sigText, setSigText] = useState("");
  const [saved, setSaved] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const advanceStep = (stepId) => {
    const idx = STEPS.findIndex(s => s.id === stepId);
    if (idx === currentStep) setCurrentStep(idx + 1);
  };

  const handleSave = () => {
    const errors = [];
    const hasName = sigText.includes(sigName) && sigName.trim().length > 2;
    const hasCargo = sigText.toLowerCase().includes("cargo") || sigText.split("\n").length >= 2;
    const hasContact = /[\d@]/.test(sigText);

    if (!sigText.trim()) errors.push("La firma está vacía. Escribí tu nombre, cargo y datos de contacto.");
    else {
      if (sigText.trim().split("\n").length < 2) errors.push("La firma debe tener al menos 2 líneas (nombre + cargo/contacto).");
      if (!hasContact) errors.push("Incluí al menos un dato de contacto (email o teléfono).");
    }

    if (errors.length === 0) {
      setSaved(true);
      setFeedback({ type: "success" });
      if (onProgress) onProgress({ type: "success" });
    } else {
      setFeedback({ type: "error", errors });
      if (onProgress) onProgress({ type: "error", errors });
    }
  };

  const handleRetry = () => { setFeedback(null); setSaved(false); };
  const handleComplete = () => {
    setFeedback(null); setStarted(false); setCurrentStep(0);
    setSettingsOpen(false); setAllSettingsOpen(false); setActiveTab("general");
    setSignatureSectionVisible(false); setCreateSigOpen(false);
    setSigName(""); setSigText(""); setSaved(false);
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 p-6">
        <div className="max-w-lg w-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Simulador de Gmail</span>
          </div>
          <h2 className="text-xl font-semibold text-zinc-100 mb-1">{content?.title}</h2>
          <div className="mt-4 mb-5 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
            <p className="text-sm text-zinc-300 leading-relaxed">{content?.description}</p>
          </div>
          <div className="bg-purple-950/40 border border-purple-800/30 rounded-xl p-4 mb-6">
            <p className="text-xs text-purple-300 font-medium mb-1">🎯 Tu tarea</p>
            <p className="text-sm text-purple-200">Configurar una firma de correo con tu nombre, cargo y datos de contacto en Gmail.</p>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            <Play className="w-4 h-4" />
            Comenzar ejercicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-purple-500" />
        <span className="text-xs text-zinc-400 font-medium">Simulador de Gmail — Firma de correo</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Gmail Mock */}
        <div className="flex-1 overflow-y-auto bg-white">
          {/* Gmail top bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-red-500 font-bold text-lg">Gmail</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Settings gear */}
              <div className="relative">
                <button
                  onClick={() => {
                    setSettingsOpen(!settingsOpen);
                    if (!settingsOpen) advanceStep("settings");
                  }}
                  className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${currentStep === 0 ? "ring-2 ring-blue-500 ring-offset-1 animate-pulse" : ""}`}
                  title="Configuración"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                {settingsOpen && !allSettingsOpen && (
                  <div className="absolute right-0 top-10 w-72 bg-white shadow-xl rounded-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-800">Configuración rápida</p>
                    </div>
                    <div className="p-3">
                      <button
                        onClick={() => {
                          setAllSettingsOpen(true);
                          setSettingsOpen(false);
                          advanceStep("see_all");
                        }}
                        className={`w-full text-left text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg font-medium transition-colors ${currentStep === 1 ? "ring-2 ring-blue-500 bg-blue-50" : ""}`}
                      >
                        Ver toda la configuración →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Settings page */}
          {allSettingsOpen ? (
            <div className="p-4">
              <h2 className="text-lg font-medium text-gray-800 mb-4">Configuración</h2>
              {/* Tabs */}
              <div className="flex gap-1 border-b border-gray-200 mb-4 overflow-x-auto">
                {["General", "Etiquetas", "Bandeja de entrada", "Cuentas", "Filtros"].map(tab => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab.toLowerCase());
                      if (tab === "General") advanceStep("general_tab");
                    }}
                    className={`px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
                      activeTab === tab.toLowerCase()
                        ? "border-blue-600 text-blue-600 font-medium"
                        : "border-transparent text-gray-600 hover:text-gray-800"
                    } ${tab === "General" && currentStep === 2 ? "ring-2 ring-blue-400 rounded-t" : ""}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {activeTab === "general" && (
                <div className="space-y-6 max-w-2xl">
                  {/* Idioma - fake section */}
                  <div className="pb-4 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-1">Idioma</p>
                    <p className="text-sm text-gray-500">Español (Latinoamérica)</p>
                  </div>

                  {/* Firma */}
                  <div className={`pb-4 border-b border-gray-100 ${currentStep === 3 ? "ring-2 ring-blue-400 rounded-lg p-3" : ""}`}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-gray-700">Firma</p>
                      {!signatureSectionVisible && currentStep === 3 && (
                        <button
                          onClick={() => { setSignatureSectionVisible(true); advanceStep("signature_section"); }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Ver sección ↓
                        </button>
                      )}
                    </div>

                    {(!signatureSectionVisible && currentStep === 3) ? (
                      <button
                        onClick={() => { setSignatureSectionVisible(true); advanceStep("signature_section"); }}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Hacé clic aquí para ver la sección de firmas
                      </button>
                    ) : signatureSectionVisible || currentStep > 3 ? (
                      <div>
                        {!createSigOpen ? (
                          <div>
                            <p className="text-xs text-gray-500 mb-3">No hay firmas creadas todavía.</p>
                            <button
                              onClick={() => { setCreateSigOpen(true); advanceStep("create_sig"); }}
                              className={`flex items-center gap-2 text-sm text-blue-600 border border-blue-300 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors ${currentStep === 4 ? "ring-2 ring-blue-500 animate-pulse" : ""}`}
                            >
                              + Crear nueva firma
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Nombre de la firma</label>
                              <input
                                type="text"
                                value={sigName}
                                onChange={e => { setSigName(e.target.value); if (currentStep === 5) advanceStep("fill_sig"); }}
                                placeholder="Ej: Firma principal"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500 block mb-1">Contenido de la firma (nombre, cargo, contacto)</label>
                              <textarea
                                value={sigText}
                                onChange={e => { setSigText(e.target.value); if (currentStep === 5) advanceStep("fill_sig"); }}
                                placeholder={"Juan Pérez\nAnalista de Sistemas\njuan.perez@empresa.com | +54 11 1234-5678"}
                                rows={5}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none font-mono"
                              />
                            </div>
                            {sigText.trim() && (
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wide">Vista previa</p>
                                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans">{sigText}</pre>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>

                  {/* Save button */}
                  {createSigOpen && (
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={handleRetry}
                        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Cancelar
                      </button>
                      <button
                        onClick={() => { advanceStep("save"); handleSave(); }}
                        className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors ${currentStep >= 5 && sigText.trim() ? "ring-2 ring-blue-300" : ""}`}
                      >
                        <Check className="w-4 h-4" />
                        Guardar cambios
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Inbox mock when settings not open */
            <div className="p-4 text-center text-gray-400 text-sm mt-12">
              <p>📬 Bandeja de entrada</p>
              <p className="text-xs mt-2 text-gray-300">Hacé clic en ⚙️ para ir a Configuración</p>
            </div>
          )}
        </div>

        {/* Steps sidebar */}
        <div className="w-56 flex-shrink-0 bg-zinc-900 border-l border-white/[0.06] overflow-y-auto p-3">
          <p className="text-[10px] text-zinc-500 uppercase tracking-wide mb-3 font-medium">Pasos del ejercicio</p>
          <div className="space-y-2">
            {STEPS.map((step, i) => (
              <div key={step.id} className={`flex items-start gap-2 text-[11px] leading-snug ${i < currentStep ? "text-emerald-400" : i === currentStep ? "text-zinc-200" : "text-zinc-600"}`}>
                <span className="flex-shrink-0 mt-0.5">
                  {i < currentStep ? <Check className="w-3 h-3 text-emerald-400" /> : i === currentStep ? <span className="w-3 h-3 inline-block rounded-full bg-blue-500 mt-0.5" /> : <span className="w-3 h-3 inline-block rounded-full bg-zinc-700 mt-0.5" />}
                </span>
                {step.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {feedback && (
        <SimulationFeedback
          type={feedback.type}
          errors={feedback.errors}
          onRetry={handleRetry}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}