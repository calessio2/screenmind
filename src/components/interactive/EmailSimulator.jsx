import React, { useState } from "react";
import { Send, Eye, EyeOff } from "lucide-react";
import SimulationFeedback from "./SimulationFeedback";
import TaskSteps from "./TaskSteps";

export default function EmailSimulator({ content }) {
  const scenario = content?.config?.email_scenario || {};
  const description = content?.description || "";

  const [to, setTo] = useState(scenario.to || "");
  const [subject, setSubject] = useState(scenario.subject || "");
  const [body, setBody] = useState(scenario.body || "");
  const [showCCO, setShowCCO] = useState(false);
  const [cco, setCco] = useState("");
  const [feedback, setFeedback] = useState(null);

  const needsCCO = scenario.show_cco === true;
  const targetAction = scenario.target_action || "Enviar el email correctamente";

  const taskDescription = needsCCO
    ? "Vas a redactar un email usando copia oculta (CCO). La copia oculta permite enviar un email a varias personas sin que vean las direcciones entre sí, a diferencia de «Para» y «CC» donde todos los destinatarios son visibles."
    : description;

  // Build steps with completion status
  const steps = [];
  if (scenario.to) steps.push({
    label: `Escribí «${scenario.to}» en el campo Para`,
    done: to.trim() === scenario.to
  });
  if (scenario.subject) steps.push({
    label: `Escribí «${scenario.subject}» en el Asunto`,
    done: subject.trim() === scenario.subject
  });
  if (needsCCO) steps.push({
    label: "Hacé clic en «Mostrar CCO» y agregá un destinatario en copia oculta",
    done: showCCO && cco.trim().length > 0
  });
  if (scenario.body) steps.push({
    label: "Escribí el cuerpo del email",
    done: body.trim().length > 0
  });
  steps.push({ label: "Hacé clic en «Enviar» para completar la tarea", done: false });

  const completedSteps = steps.map((s, i) => (s.done ? i : -1)).filter((i) => i >= 0);

  const handleSend = () => {
    const errors = [];
    if (scenario.to && to.trim() !== scenario.to) {
      errors.push(`El destinatario en «Para» debe ser «${scenario.to}». Revisá que esté bien escrito.`);
    }
    if (needsCCO && !cco.trim()) {
      errors.push("Falta agregar un destinatario en copia oculta (CCO). Acordate de hacer clic en «Mostrar CCO» primero para revelar el campo.");
    }
    if (scenario.subject && subject.trim() !== scenario.subject) {
      errors.push(`El asunto debe ser «${scenario.subject}».`);
    }
    if (scenario.body && body.trim().length === 0) {
      errors.push("El cuerpo del email está vacío. Escribí un mensaje antes de enviar.");
    }

    if (errors.length === 0) {
      setFeedback({ type: "success" });
    } else {
      setFeedback({ type: "error", errors });
    }
  };

  const handleRetry = () => setFeedback(null);

  const handleComplete = () => {
    setFeedback(null);
    setTo(scenario.to || "");
    setSubject(scenario.subject || "");
    setBody(scenario.body || "");
    setCco("");
    setShowCCO(false);
  };

  return (
    <div className="relative flex flex-col h-full bg-zinc-950">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06]">
        <span className="w-2 h-2 rounded-full bg-blue-500" />
        <span className="text-xs text-zinc-400 font-medium">Simulador de Email</span>
        <span className="text-[10px] text-zinc-600 ml-auto truncate max-w-[200px]">Tarea: {targetAction}</span>
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

      <TaskSteps
        description={taskDescription}
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