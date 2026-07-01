import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ConversationSidebar from "@/components/screen-agent/ConversationSidebar";
import ChatPanel from "@/components/screen-agent/ChatPanel";
import DynamicPanel from "@/components/screen-agent/DynamicPanel";
import { Menu, X } from "lucide-react";
import InteractiveContentViewer from "@/components/interactive/InteractiveContentViewer";

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
  const [interactiveContents, setInteractiveContents] = useState([]);
  const [activeInteractive, setActiveInteractive] = useState(null);
  const canvasRef = useRef(document.createElement("canvas"));
  const pendingPromptRef = useRef(null);

  useEffect(() => {
    base44.entities.Conversation.list("-created_date", 50).then(setConversations);
    base44.entities.Process.filter({ status: "active" }).then(setProcesses).catch(() => {});
    base44.entities.InteractiveContent.filter({ status: "active" }).then(setInteractiveContents).catch(() => {});
    base44.auth.me().then(setUser).catch(() => {});

    // If navigated with ?content=ID, open that interactive content immediately
    const urlParams = new URLSearchParams(window.location.search);
    const contentId = urlParams.get("content");
    if (contentId) {
      base44.entities.InteractiveContent.get(contentId).then((content) => {
        if (content) {
          setActiveInteractive(content);
          setPanelMode("interactive");
        }
      }).catch(() => {});
    }
    // If navigated with ?prompt=..., auto-create a conversation and send the prompt
    const promptParam = urlParams.get("prompt");
    if (promptParam) {
      pendingPromptRef.current = promptParam;
      base44.entities.Conversation.create({
        title: `Sesión ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`,
        messages: [],
        status: "active",
      }).then(conv => {
        setConversations(prev => [conv, ...prev]);
        setActiveConvId(conv.id);
      }).catch(() => {});
    }
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
    setActiveInteractive(null);
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
    return conv;
  };

  // When a pending prompt is set and a new conversation is created, send it automatically
  useEffect(() => {
    if (!activeConvId || !pendingPromptRef.current) return;
    const prompt = pendingPromptRef.current;
    pendingPromptRef.current = null;
    sendMessage(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

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

  const buildInteractiveList = () => {
    if (interactiveContents.length === 0) return "No hay contenidos interactivos disponibles.";
    return interactiveContents.map(c => {
      let entry = `ID: ${c.id} | Título: ${c.title} | Tipo: ${c.type} | Software: ${c.software || "N/A"} | Descripción: ${c.description || "N/A"} | Keywords: ${c.keywords || "N/A"}`;
      if (c.transcript) {
        entry += `\n  CONTENIDO TRANSCRITO DEL VIDEO: ${c.transcript.substring(0, 3000)}`;
      }
      return entry;
    }).join('\n');
  };

  const handleAction = (action, processId, stepIndex, userText, interactiveId) => {
    if (action === "show_interactive" && interactiveId) {
      const content = interactiveContents.find(c => c.id === interactiveId);
      if (content) {
        setActiveInteractive(content);
        setPanelMode("interactive");
      }
    } else if (action === "show_guide") {
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
      }
      setPanelMode("guide");
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

      // Auto-capture screenshot when sharing screen so the tutor can see and guide step by step
      if (isSharing && !image) {
        try {
          const blob = await captureScreenshot();
          if (blob) {
            const screenFile = new File([blob], "screen.jpg", { type: "image/jpeg" });
            const result = await base44.integrations.Core.UploadFile({ file: screenFile });
            file_url = result.file_url;
          }
        } catch (e) {
          // ignore capture errors
        }
      }

      const hasVisual = !!file_url;
      const isImageMsg = text.startsWith("📎 Imagen") || (image && !text.trim().replace("📎 Imagen enviada para análisis", "").trim());

      const screenState = isSharing
        ? "EL USUARIO ESTÁ COMPARTIENDO SU PANTALLA EN VIVO AHORA MISMO. Tenés una captura de su pantalla actual adjunta para que puedas ver exactamente qué tiene abierto y en qué paso está."
        : "El usuario NO está compartiendo su pantalla.";

      const prompt = hasVisual
        ? `Sos LIP, un tutor digital. ${isSharing ? "El usuario está compartiendo su pantalla y tenés una captura adjunta de lo que tiene abierto ahora mismo." : "El usuario envió una imagen."}${text && !text.startsWith("📎") ? ` Mensaje del usuario: "${text}"` : ""}

Analizá la captura con atención al detalle:
1. IDENTIFICÁ qué aplicación o sitio está abierto (Excel, Word, Google Docs, Gmail, Corel, un sistema interno, etc.)
2. LEÉ el texto visible: títulos, botones, menús, campos, pestañas, barras de herramientas
3. DETERMINÁ en qué punto de su tarea está el usuario
4. DÁ instrucciones paso a paso, claras y específicas, diciendo EXACTAMENTE en qué elemento hacer clic o qué escribir

Contexto previo:
${buildContext(messages) || "No hay contexto previo."}

Procesos y guías disponibles:
${buildProcessList()}

Contenidos interactivos disponibles:
${buildInteractiveList()}

IMPORTANTE: Combiná tu conocimiento del software que veas abierto (Excel, Docs, Office, Corel, etc.) con las guías y procesos disponibles arriba para dar las mejores instrucciones. Para videos de YouTube, tenés acceso al contenido transcrito.

Respondé en español, de forma clara y concisa. Usá markdown con pasos numerados cuando corresponda. Si lo que ves coincide con un proceso disponible, podés usar "show_guide" para mostrarlo en el panel además de explicar. Si el usuario ya completó la tarea, felicitalo y preguntá si necesita algo más.`
        : `Sos LIP, un tutor digital. Ayudás a las personas a aprender, practicar y resolver dudas sobre software, procesos y herramientas.

Procesos y guías disponibles:
${buildProcessList()}

Contenidos interactivos disponibles (videos, simuladores, juegos):
${buildInteractiveList()}

IMPORTANTE: Para los videos de YouTube, tenés acceso al CONTENIDO TRANSCRITO del video. Usá esa información para responder preguntas específicas sobre qué explica el video, qué pasos muestra, o qué temas cubre, sin necesidad de que el usuario lo mire completo.

Contexto previo de la conversación:
${buildContext(messages) || "No hay contexto previo."}

Estado: ${screenState}

Consulta del usuario: ${text}

Decidí la mejor forma de ayudar al usuario usando una de estas acciones:

1. "show_interactive" — Usá esta acción cuando hay un contenido interactivo disponible que coincide con la consulta (video, simulador, juego) y el usuario quiere practicar o ver un tutorial. Incluí el interactive_id exacto.

2. "show_guide" — Usá esta acción cuando el usuario quiere ver una guía paso a paso en el panel, o cuando hay un proceso disponible que coincide con la consulta. Incluí el process_id exacto y el step_index del paso más relevante (0-based).

3. "request_screenshot" — Usá esta acción cuando necesitás ver la pantalla del usuario pero NO la está compartiendo, y la consulta requiere contexto visual.

4. "none" — Usá esta acción para preguntas generales, conversación, o cuando no hay proceso o contenido que mostrar. Si el usuario quiere hacer algo práctico en un software (Excel, Docs, etc.) y no está compartiendo pantalla, sugerile que comparta su pantalla para que puedas guiarlo viendo lo que hace.

Respondé en español, de forma clara y concisa, explicando qué vas a hacer.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        ...(file_url ? { file_urls: [file_url] } : {}),
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string", description: "Respuesta al usuario en español" },
            action: { type: "string", enum: ["none", "show_guide", "show_interactive", "request_screenshot"] },
            process_id: { type: "string", description: "ID del proceso si action es show_guide" },
            interactive_id: { type: "string", description: "ID del contenido interactivo si action es show_interactive" },
            step_index: { type: "number", description: "Índice del paso a mostrar (0-based)" }
          },
          required: ["reply", "action"]
        },
        ...(hasVisual ? { model: "claude_sonnet_4_6" } : {}),
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

      handleAction(response.action, response.process_id, response.step_index, text, response.interactive_id);
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
        prompt: `Sos LIP, un tutor digital. El usuario compartió una captura de su pantalla. Analizala con detalle.

Identificá qué aplicación está abierta (Excel, Word, Docs, Corel, etc.), leé el texto visible y determiná en qué punto de la tarea está. Después dá instrucciones paso a paso para ayudarlo a avanzar.

Contexto previo:
${buildContext(messages) || "No hay contexto previo."}

Procesos y guías disponibles:
${buildProcessList()}

Combiná tu conocimiento del software con las guías disponibles. Respondé en español, con markdown y pasos numerados. Si la tarea ya está completa, felicitalo.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string", description: "Respuesta al usuario en español" },
            action: { type: "string", enum: ["none", "show_guide"] },
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
        request_screenshot: false,
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

  const handleSimulationEvent = useCallback(async (event) => {
    if (!activeConvId) return;

    if (event.type === "success") {
      const userMsg = { role: "user", content: "✅ Completé la simulación de email correctamente.", timestamp: new Date().toISOString() };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setIsLoading(true);

      // Accumulate progress on goal milestones linked to the activity that was just completed
      try {
        const me = await base44.auth.me();
        const myGoals = await base44.entities.Goal.filter({ assigned_to_id: me.id, status: "active" });
        const completedContentId = activeInteractive?.id;

        for (const goal of myGoals) {
          if (!goal.steps || goal.steps.length === 0) continue;
          let changed = false;
          const newSteps = goal.steps.map(step => {
            if (step.completed || !step.linked_content_id || step.linked_content_id !== completedContentId) return step;
            const target = step.target_count || 1;
            const newCount = (step.current_count || 0) + 1;
            changed = true;
            return { ...step, current_count: newCount, completed: newCount >= target };
          });
          if (changed) {
            const allCompleted = newSteps.every(s => s.completed);
            await base44.entities.Goal.update(goal.id, { steps: newSteps, status: allCompleted ? "completed" : "active" });
          }
        }
      } catch (err) {
        // silent fail - goal update shouldn't block the chat
      }

      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Sos un Tutor de Adopción Digital corporativo. El usuario acaba de completar exitosamente una simulación de envío de email con copia oculta (CCO).

Contexto previo:
${buildContext(messages) || "No hay contexto previo."}

El usuario completó todos los pasos correctamente. Felicitalo brevemente y ofrecele continuar aprendiendo o practicar otra cosa. Respondé en español, de forma breve y motivadora.`,
          response_json_schema: {
            type: "object",
            properties: {
              reply: { type: "string", description: "Respuesta al usuario en español" }
            },
            required: ["reply"]
          },
        });
        const assistantMsg = { role: "assistant", content: response.reply, timestamp: new Date().toISOString() };
        const final = [...updated, assistantMsg];
        setMessages(final);
        await saveMessages(activeConvId, final);
      } catch (err) {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    } else if (event.type === "error") {
      const errorList = event.errors.map(e => `- ${e}`).join("\n");
      const userMsg = { role: "user", content: `❌ Tuve errores en la simulación de email:\n${errorList}`, timestamp: new Date().toISOString() };
      const updated = [...messages, userMsg];
      setMessages(updated);
      setIsLoading(true);
      try {
        const response = await base44.integrations.Core.InvokeLLM({
          prompt: `Sos un Tutor de Adopción Digital corporativo. El usuario intentó enviar un email en el simulador pero cometió algunos errores.

Contexto previo:
${buildContext(messages) || "No hay contexto previo."}

Errores del usuario:
${errorList}

Ayudalo a entender brevemente cómo corregirlos y animarlo a intentar de nuevo. Respondé en español, de forma clara y concisa.`,
          response_json_schema: {
            type: "object",
            properties: {
              reply: { type: "string", description: "Respuesta al usuario en español" }
            },
            required: ["reply"]
          },
        });
        const assistantMsg = { role: "assistant", content: response.reply, timestamp: new Date().toISOString() };
        const final = [...updated, assistantMsg];
        setMessages(final);
        await saveMessages(activeConvId, final);
      } catch (err) {
        // silent fail
      } finally {
        setIsLoading(false);
      }
    }
  }, [activeConvId, messages]);

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
            <h1 className="text-3xl font-semibold text-zinc-100 mb-3 tracking-tight">LIP Tutor</h1>
            <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
              Tu plataforma de aprendizaje interactivo. Aprendé, practicá y consultá con guías, simuladores, videos y más.
            </p>
            <button
              onClick={createConversation}
              className="bg-white text-zinc-950 hover:bg-zinc-200 px-6 py-2.5 rounded-xl font-medium text-sm transition-colors"
            >
              Nuevo chat
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
              interactiveContents={interactiveContents}
              onOpenInteractive={(c) => {
                setActiveInteractive(c);
                setPanelMode("interactive");
              }}
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
              interactiveContent={activeInteractive}
              onSimulationEvent={handleSimulationEvent}
            />
          </div>
        </div>
      )}
    </div>
  );
}