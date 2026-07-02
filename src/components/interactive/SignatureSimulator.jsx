import React, { useState, useEffect } from "react";
import { Play, PenLine, Check } from "lucide-react";
import SimulationFeedback from "./SimulationFeedback";
import TaskSteps from "./TaskSteps";

export default function SignatureSimulator({ content, onProgress }) {
  const scenario = content?.config?.email_scenario || {};
  const description = content?.description || "";
  const narrative = content?.config?.narrative || description;
  const targetAction = scenario.target_action || "Configurar tu firma de correo";

  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [feedback, setFeedback] = useState(null);

  const fields = [
    { key: "name", label: "Nombre y apellido", value: name },
    { key: "role", label: "Cargo / puesto", value: role },
    { key: "phone", label: "Teléfono de contacto", value: phone },
    { key: "email", label: "Email de contacto", value: email },
    { key: "company", label: "Empresa / área", value: company },
  ];

  const steps = fields.map((f) => ({
    label: `Completá el campo «${f.label}»`,
    done: f.value.trim().length > 0,
  }));
  steps.push({ label: "Revisá la vista previa y enviá la firma", done: false });

  const completedSteps = steps.map((s, i) => (s.done ? i : -1)).filter((i) => i >= 0);

  useEffect(() => {
    if (onProgress) {
      onProgress({
        type: "progress",
        total: steps.length,
        completed: completedSteps.length,
        steps: steps.map((s, i) => ({ label: s.label, done: completedSteps.includes(i) })),
      });
    }
  }, [name, role, phone, email, company]);

  const handleSend = () => {
    const errors = [];
    fields.forEach((f) => {
      if (!f.value.trim()) {
        errors.push(`Falta completar el campo «${f.label}».`);
      }
    });
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.push("El email de contacto no tiene un formato válido.");
    }

    if (errors.length === 0) {
      setFeedback({ type: "success" });
      if (onProgress) onProgress({ type: "success" });
    } else {
      setFeedback({ type: "error", errors });
      if (onProgress) onProgress({ type: "error", errors });
    }
  };

  const handleRetry = () => setFeedback(null);

  const handleComplete = () => {
    setFeedback(null);
    setStarted(false);
    setName(""); setRole(""); setPhone(""); setEmail(""); setCompany("");
  };

  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 p-6">
        <div className="max-w-lg w-full">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Simulador de Firma</span>
          </div>

          <h2 className="text-xl font-semibold text-zinc-100 mb-1">{content?.title}</h2>

          {narrative && (
            <div className="mt-4 mb-5 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <PenLine className="w-4 h-4 text-violet-400 flex-shrink-0" />
                <span className="text-xs font-medium text-violet-400 uppercase tracking-wide">Contexto del ejercicio</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{narrative}</p>
            </div>
          )}

          <div className="bg-violet-950/40 border border-violet-800/30 rounded-xl p-4 mb-6">
            <p className="text-xs text-violet-300 font-medium mb-1">🎯 Tu tarea</p>
            <p className="text-sm text-violet-200">{targetAction}</p>
          </div>

          <button
            onClick={() => setStarted(true)}
            className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-medium py-3 rounded-xl transition-colors"
          >
            <Play className="w-4 h-4" />
            Comenzar ejercicio
          </button>
        </div>
      </div>
    );
  }

  const inputClass = "w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-300 transition-colors";

  return (
    <div className="relative flex flex-col h-full bg-zinc-950">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <span className="w-2 h-2 rounded-full bg-violet-500" />
        <span className="text-xs text-zinc-400 font-medium">Simulador de Firma</span>
        <span className="text-[10px] text-zinc-600 ml-auto truncate max-w-[200px]">Tarea: {targetAction}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-5 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-700 mb-1">Completá los datos de tu firma</h3>
            {fields.map((f) => (
              <div key={f.key}>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">{f.label}</label>
                <input
                  type="text"
                  value={f.value}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (f.key === "name") setName(v);
                    if (f.key === "role") setRole(v);
                    if (f.key === "phone") setPhone(v);
                    if (f.key === "email") setEmail(v);
                    if (f.key === "company") setCompany(v);
                  }}
                  placeholder={f.label}
                  className={inputClass}
                />
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl shadow-lg p-5">
            <h3 className="text-sm font-semibold text-zinc-700 mb-3">Vista previa</h3>
            <div className="border-l-4 border-violet-500 pl-4 py-2">
              {name ? <p className="text-base font-semibold text-zinc-800">{name}</p> : <p className="text-base font-semibold text-zinc-300">Tu nombre</p>}
              {role && <p className="text-sm text-zinc-600">{role}{company ? ` · ${company}` : ""}</p>}
              <div className="mt-2 space-y-0.5">
                {phone && <p className="text-xs text-zinc-500">📞 {phone}</p>}
                {email && <p className="text-xs text-violet-600">✉ {email}</p>}
              </div>
            </div>
            <button
              onClick={handleSend}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              <Check className="w-4 h-4" />
              Guardar firma
            </button>
          </div>
        </div>
      </div>

      <TaskSteps
        description="Completá todos los campos para armar tu firma profesional. La vista previa se actualiza mientras escribís."
        steps={steps.map((s) => s.label)}
        completedSteps={completedSteps}
      />

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