import React, { useState } from "react";
import { Send, Eye, EyeOff, Check } from "lucide-react";

export default function EmailSimulator({ config }) {
  const scenario = config?.email_scenario || {};
  const [to, setTo] = useState(scenario.to || "");
  const [subject, setSubject] = useState(scenario.subject || "");
  const [body, setBody] = useState(scenario.body || "");
  const [showCCO, setShowCCO] = useState(false);
  const [cco, setCco] = useState("");
  const [sent, setSent] = useState(false);

  const needsCCO = scenario.show_cco === true;
  const targetAction = scenario.target_action || "Enviar el email correctamente";

  const handleSend = () => {
    const checks = [];
    if (scenario.to && to.trim() !== scenario.to) checks.push("El destinatario no coincide");
    if (needsCCO && !cco.trim()) checks.push("Falta agregar el destinatario en copia oculta (CCO)");
    if (scenario.subject && subject.trim() !== scenario.subject) checks.push("El asunto no coincide");

    if (checks.length === 0) {
      setSent(true);
    } else {
      alert(`Revisá: ${checks.join(", ")}`);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 p-6">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-zinc-200 font-medium text-sm mb-2">¡Email enviado correctamente!</h3>
        <p className="text-zinc-600 text-xs text-center max-w-xs">
          Completaste la tarea: {targetAction}
        </p>
        <button
          onClick={() => {
            setSent(false);
            setTo(scenario.to || "");
            setSubject(scenario.subject || "");
            setBody(scenario.body || "");
            setCco("");
            setShowCCO(false);
          }}
          className="mt-6 text-xs text-blue-400 hover:text-blue-300"
        >
          Intentar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-xs text-zinc-400 font-medium">Simulador de Email</span>
        <span className="text-[10px] text-zinc-600 ml-auto">Tarea: {targetAction}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-3 flex items-center gap-2">
            <span className="text-sm font-medium text-zinc-700">Redactar email</span>
            <button
              onClick={() => setShowCCO(!showCCO)}
              className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded hover:bg-blue-50"
            >
              {showCCO ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              {showCCO ? "Ocultar CCO" : "Mostrar CCO"}
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
              <label className="text-xs font-medium text-zinc-500 w-12">Para:</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="destinatario@ejemplo.com"
                className="flex-1 text-sm outline-none text-zinc-800 bg-transparent"
              />
            </div>
            {showCCO && (
              <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
                <label className="text-xs font-medium text-zinc-500 w-12">CCO:</label>
                <input
                  type="text"
                  value={cco}
                  onChange={(e) => setCco(e.target.value)}
                  placeholder="copia_oculta@ejemplo.com"
                  className="flex-1 text-sm outline-none text-zinc-800 bg-transparent"
                />
              </div>
            )}
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-2">
              <label className="text-xs font-medium text-zinc-500 w-12">Asunto:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Asunto del email"
                className="flex-1 text-sm outline-none text-zinc-800 bg-transparent"
              />
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribí el cuerpo del email..."
              rows={8}
              className="w-full text-sm outline-none text-zinc-800 bg-transparent resize-none"
            />
          </div>
          <div className="border-t border-zinc-200 px-4 py-3 flex justify-end">
            <button
              onClick={handleSend}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}