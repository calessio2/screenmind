import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ConversationSidebar from "@/components/screen-agent/ConversationSidebar";
import ChatPanel from "@/components/screen-agent/ChatPanel";
import DynamicPanel from "@/components/screen-agent/DynamicPanel";
import { Menu, X } from "lucide-react";

export default function Home() {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stream, setStream] = useState(null);
  const [isSharing, setIsSharing] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [panelMode, setPanelMode] = useState("default");
  const [activeProcess, setActiveProcess] = useState(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [screenshotRequested, setScreenshotRequested] = useState(false);
  const [processes, setProcesses] = useState([]);
  const canvasRef = useRef(document.createElement("canvas"));

  useEffect(() => {
    base44.entities.Conversation.list("-created_date", 50).then(setConversations);
    base44.entities.Process.filter({ status: "active" }).then(setProcesses).catch(() => {});
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeConvId) {
      const conv = conversations.find((c) => c.id === activeConvId);
      setMessages(conv?.messages || []);
    } else {
      setMessages([]);
    }
    setPanelMode("default");
    setActiveProcess(null);
    setScreenshotRequested(false);
  }, [activeConvId]);

  const createConversation = async () => {
    const conv = await base44.entities.Conversation.create({
      title: `Sesión ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`,
      messages: [],
      status: "active",
    });
    setConversations((prev) => [conv, ...prev]);
    setActiveConvId(conv.id);
    setSidebarOpen(false);
  };

  const deleteConversation = async (id) => {
    await base44.entities.Conversation.delete(id);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvId === id) {
      setActiveConvId(null);
      setMessages([]);
    }
  };

  const saveMessages = async (convId, newMessages) => {
    const serializable = newMessages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      ...(m.guide_ref ? { guide_ref: m.guide_ref } : {}),
      ...(m.request_screenshot ? { request_screenshot: m.request_screenshot } : {}),
    }));
    await base44.entities.Conversation.update(convId, { messages: serializable });
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, messages: newMessages } : c))
    );
  };

  const buildContext = (msgs) => {
    return msgs.slice(-6).map(m => `${m.role === 'user' ? 'Usuario' : 'Tutor'}: ${m.content}`).join('\n');
  };

  const buildProcessList = () => {
    if (processes.length === 0) return "No hay procesos disponibles aún.";
    return processes.map(p =>
      `ID: ${p.id} | Título: ${p.title} | Software: ${p.software || "N/A"} | Descripción: ${p.description || "N/A"} | Keywords: ${p.keywords || "N/A"}`
    ).join('\n');
  };

  const handleAction = (action, processId, stepIndex, userText) => {
    if (action === "show_guide") {
      let process = processId ? processes.find(p => p.id === processId) : null;
      if (!process && userText) {
        const lower = userText.toLowerCase();
        process = processes.find(p =>
          p.title?.toLowerCase().includes(lower) ||
          lower.includes(p.title?.toLowerCase()) ||
          (p.keywords && p.keywords.toLowerCase().split(",").some(k => lower.includes(k.trim())))
        );
      }
      if (process) {
        setActiveProcess(process);
        setActiveStepIndex(typeof stepIndex === "number" ? stepIndex : 0);
        setPanelMode("guide");
      }
    } else if (action === "request_screenshot") {
      setPanelMode("screen");
      setScreenshotRequested(true);
    }
  };

  const sendMessage = async (text, image) => {
    if (!activeConvId) return;
    setIsLoading(true);

    const userMsg = { role: "user", content: text, timestamp: new Date().toISOString() };
    const updated = [...messages, userMsg];
    setMessages(updated);

    try {
      let file_url = null;
      if (image) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: image });
        file_url = uploadResult.file_url;
      }

      const isImageMsg = text.startsWith("📎 Imagen") || (image && !text.trim().replace("📎 Imagen enviada para análisis", "").trim());

      const prompt = isImageMsg
        ? `Sos un Tutor de Adopción Digital corporativo. El usuario envió una imagen${text && !text.startsWith("📎") ? ` con el mensaje: "${text}"` : ""}. Analizala y ayudalo con lo que necesite.

Contexto previo:
${buildContext(messages) || "No hay contexto previo."}

Procesos disponibles:
${buildProcessList()}

Respondé en español, de forma clara y concisa. Usá markdown con pasos numerados si corresponde. Si lo que ves coincide con un proceso disponible, usá "show_guide".`
        : `Sos un Tutor de Adopción Digital corporativo. Ayudás a los empleados a usar software y seguir procesos internos de la empresa.

Procesos y guías disponibles:
${buildProcessList()}

Contexto previo de la conversación:
${buildContext(messages) || "No hay contexto previo."}

Consulta del usuario: ${text}
${image ? "\nNota: El usuario también adjuntó una imagen relacionada con su consulta. Analizala junto con el texto." : ""}
Instrucciones:
- Si la consulta del usuario coincide con un proceso disponible, O si el usuario pide que le muestres algo (ej: "mostrame", "mostrar", "quiero ver", " enseñame"), DEBÉS usar "show_guide" con el process_id exacto del proceso correspondiente y el step_index del paso más relevante (0-based).
- Si necesitás ver la pantalla del usuario para ayudarlo, usá "request_screenshot".
- Solo usá "none" si la consulta no tiene ninguna relación con los procesos disponibles.
- Respondé en español, de forma clara y concisa, explicando qué vas a mostrar en el panel.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        ...(file_url ? { file_urls: [file_url] } : {}),
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string", description: "Respuesta al usuario en español" },
            action: { type: "string", enum: ["none", "show_guide", "request_screenshot"] },
            process_id: { type: "string", description: "ID del proceso si action es show_guide" },
            step_index: { type: "number", description: "Índice del paso a mostrar (0-based)" }
          },
          required: ["reply", "action"]
        },
        ...(isImageMsg ? { model: "claude_sonnet_4_6" } : {}),
      });

      const assistantMsg = {
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toISOString(),
        guide_ref: response.action === "show_guide" ? response.process_id : undefined,
        request_screenshot: response.action === "request_screenshot",
      };
      const final = [...updated, assistantMsg];
      setMessages(final);
      await saveMessages(activeConvId, final);

      handleAction(response.action, response.process_id, response.step_index, text);
    } catch (err) {
      const errorMsg = {
        role: "assistant",
        content: "❌ Hubo un error al procesar tu consulta. Intentá de nuevo.",
        timestamp: new Date().toISOString(),
      };
      const final = [...updated, errorMsg];
      setMessages(final);
      await saveMessages(activeConvId, final);
    } finally {
      setIsLoading(false);
    }
  };

  const captureScreenshot = useCallback(async () => {
    if (!stream) return null;
    const track = stream.getVideoTracks()[0];
    if (!track) return null;

    const settings = track.getSettings();
    const canvas = canvasRef.current;
    canvas.width = settings.width || 1920;
    canvas.height = settings.height || 1080;
    const ctx = canvas.getContext("2d");

    const tempVideo = document.createElement("video");
    tempVideo.srcObject = stream;
    tempVideo.muted = true;
    await tempVideo.play();
    ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);
    tempVideo.pause();
    tempVideo.srcObject = null;

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
    });
  }, [stream]);

  const captureAndAnalyze = useCallback(async () => {
    if (!activeConvId || !stream) return;
    setIsCapturing(true);

    try {
      const blob = await captureScreenshot();
      if (!blob) return;

      const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const userMsg = { role: "user", content: "📸 Captura de pantalla analizada", timestamp: new Date().toISOString() };
      const updated = [...messages, userMsg];
      setMessages(updated);

      setScreenshotRequested(false);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un Tutor de Adopción Digital corporativo. El usuario compartió una captura de su pantalla. Analizala y guialo sobre lo que ves.

Contexto previo:
${buildContext(messages) || "No hay contexto previo."}

Procesos disponibles:
${buildProcessList()}

Respondé en español, de forma clara. Si lo que ves en la pantalla coincide con un proceso disponible, usá "show_guide". Si necesitás más información, usá "none".`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string", description: "Respuesta al usuario en español" },
            action: { type: "string", enum: ["none", "show_guide", "request_screenshot"] },
            process_id: { type: "string" },
            step_index: { type: "number" }
          },
          required: ["reply", "action"]
        },
        model: "claude_sonnet_4_6",
      });

      const assistantMsg = {
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toISOString(),
        guide_ref: response.action === "show_guide" ? response.process_id : undefined,
        request_screenshot: response.action === "request_screenshot",
      };
      const final = [...updated, assistantMsg];
      setMessages(final);
      await saveMessages(activeConvId, final);

      handleAction(response.action, response.process_id, response.step_index);
    } catch (err) {
      const errorMsg = {
        role: "assistant",
        content: "❌ Hubo un error al analizar la captura. Intentá de nuevo.",
        timestamp: new Date().toISOString(),
      };
      const final = [...messages, errorMsg];
      setMessages(final);
      await saveMessages(activeConvId, final);
    } finally {
      setIsCapturing(false);
    }
  }, [activeConvId, stream, messages, processes, captureScreenshot]);

  const startSharing = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      setStream(mediaStream);
      setIsSharing(true);
      setPanelMode("screen");
      setScreenshotRequested(false);
      mediaStream.getVideoTracks()[0].onended = () => {
        setStream(null);
        setIsSharing(false);
      };
    } catch (err) {
      // user cancelled
    }
  };

  const stopSharing = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setIsSharing(false);
  };

  return (
    <div className="h-screen flex bg-zinc-950 text-zinc-100">
      <button
        onClick={() => {
          if (!sidebarOpen) setSidebarCollapsed(false);
          setSidebarOpen(!sidebarOpen);
        }}
        className="lg:hidden fixed top-3 left-3 z-50 bg-zinc-900/80 backdrop-blur p-2 rounded-lg text-zinc-300 border border-zinc-800"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <div className={`fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConvId}
          onSelect={(id) => { setActiveConvId(id); setSidebarOpen(false); }}
          onCreate={createConversation}
          onDelete={deleteConversation}
          user={user}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => {
            setSidebarCollapsed(!sidebarCollapsed);
            setSidebarOpen(false);
          }}
        />
      </div>

      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden" />
      )}

      {!activeConvId ? (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-zinc-950 to-zinc-900">
          <div className="text-center px-6 max-w-md">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-8">
              <span className="text-3xl">🎓</span>
            </div>
            <h1 className="text-3xl font-semibold text-zinc-100 mb-3 tracking-tight">Tutor de Adopción Digital</h1>
            <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
              Tu asistente inteligente para software y procesos corporativos. Aprendé, consultá y recibí soporte en tiempo real.
            </p>
            <button
              onClick={createConversation}
              className="bg-white text-zinc-950 hover:bg-zinc-200 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              Iniciar nueva sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-px bg-zinc-900 min-h-0 pt-14 lg:pt-0">
          <div className="lg:w-[400px] w-full flex-shrink-0 min-h-0 h-[42vh] lg:h-auto bg-zinc-950">
            <ChatPanel
              messages={messages}
              onSendMessage={sendMessage}
              isLoading={isLoading}
              isSharing={isSharing}
              onStartSharing={startSharing}
              onStopSharing={stopSharing}
            />
          </div>

          <div className="flex-1 min-h-0 h-[42vh] lg:h-auto bg-zinc-950 p-px relative">
            <DynamicPanel
              mode={panelMode}
              process={activeProcess}
              stepIndex={activeStepIndex}
              onStepChange={setActiveStepIndex}
              stream={stream}
              isSharing={isSharing}
              screenshotRequested={screenshotRequested}
              onStartSharing={startSharing}
              onStopSharing={stopSharing}
              onCapture={captureAndAnalyze}
              isCapturing={isCapturing}
            />
          </div>
        </div>
      )}
    </div>
  );
}