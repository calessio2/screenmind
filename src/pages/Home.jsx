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
  const [guidedMode, setGuidedMode] = useState(false);
  const [overlayStep, setOverlayStep] = useState(null);
  const [guidedStepNumber, setGuidedStepNumber] = useState(0);
  const [isAnalyzingStep, setIsAnalyzingStep] = useState(false);
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
    } else if (action === "show_guide" || action === "start_guided") {
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
      if (action === "start_guided" && isSharing) {
        setPanelMode("screen");
        setGuidedMode(true);
        setGuidedStepNumber(1);
        setOverlayStep(null);
        analyzeForGuidance();
      } else {
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

      const screenState = isSharing
        ? "EL USUARIO ESTÁ COMPARTIENDO SU PANTALLA EN VIVO AHORA MISMO."
        : "El usuario NO está compartiendo su pantalla.";

      const prompt = isImageMsg
        ? `Sos un Tutor de Adopción Digital corporativo. El usuario envió una imagen${text && !text.startsWith("📎") ? ` con el mensaje: "${text}"` : ""}. Analizala y ayudalo con lo que necesite.

Contexto previo:
${buildContext(messages) || "No hay contexto previo."}

Procesos disponibles:
${buildProcessList()}

Estado: ${screenState}

Respondé en español, de forma clara y concisa. Usá markdown con pasos numerados si corresponde. Si lo que ves coincide con un proceso disponible, usá "show_guide" o "start_guided" según corresponda.`
        : `Sos un Tutor de Adopción Digital corporativo. Ayudás a los empleados a usar software y seguir procesos internos de la empresa.

Procesos y guías disponibles:
${buildProcessList()}

Contenidos interactivos disponibles (videos, simuladores, juegos):
${buildInteractiveList()}

IMPORTANTE: Para los videos de YouTube, tenés acceso al CONTENIDO TRANSCRITO del video. Usá esa información para responder preguntas específicas sobre qué explica el video, qué pasos muestra, o qué temas cubre, sin necesidad de que el usuario lo mire completo.

Contexto previo de la conversación:
${buildContext(messages) || "No hay contexto previo."}

Estado: ${screenState}

Consulta del usuario: ${text}
${image ? "\nNota: El usuario también adjuntó una imagen relacionada con su consulta. Analizala junto con el texto." : ""}

Decidí la mejor forma de ayudar al usuario usando una de estas acciones:

1. "start_guided" — Usá esta acción SIEMPRE que se cumplan AMBAS condiciones:
   - El usuario está compartiendo su pantalla en vivo ahora mismo
   - El usuario quiere APRENDER o HACER algo práctico (ej: "enseñame", "cómo hago", "quiero enviar", "necesito configurar")
   Esto activará el modo overlay con realidad aumentada que le va guiando clic por clic sobre su pantalla real.

2. "show_interactive" — Usá esta acción cuando:
   - Hay un contenido interactivo disponible que coincide con la consulta del usuario (video de YouTube, simulador de email, juego de arrastrar y soltar)
   - El usuario quiere practicar, ver un video tutorial, o hacer una simulación interactiva
   Incluí el interactive_id exacto del contenido correspondiente.

3. "show_guide" — Usá esta acción cuando:
   - El usuario NO está compartiendo su pantalla y quiere ver una guía paso a paso, O
   - El usuario quiere consultar información, ver los pasos escritos, o está en modo lectura, O
   - El usuario pidió algo pero el contexto es de referencia/informativo, no de ejecución inmediata

4. "request_screenshot" — Usá esta acción cuando:
   - Necesitás ver la pantalla del usuario pero NO la está compartiendo, y la consulta requiere contexto visual que solo la pantalla puede dar

5. "none" — Usá esta acción cuando:
   - La consulta no tiene relación con ningún proceso o contenido disponible
   - Es una pregunta general, conversación, o algo que no requiere mostrar nada en el panel

Si la consulta coincide con un proceso disponible, incluí el process_id exacto y el step_index del paso más relevante (0-based).

Respondé en español, de forma clara y concisa, explicando qué vas a hacer. Si vas a usar "start_guided", decile al usuario que vas a guiarlo paso a paso sobre su pantalla.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        ...(file_url ? { file_urls: [file_url] } : {}),
        response_json_schema: {
          type: "object",
          properties: {
            reply: { type: "string", description: "Respuesta al usuario en español" },
            action: { type: "string", enum: ["none", "show_guide", "start_guided", "show_interactive", "request_screenshot"] },
            process_id: { type: "string", description: "ID del proceso si action es show_guide o start_guided" },
            interactive_id: { type: "string", description: "ID del contenido interactivo si action es show_interactive" },
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
        guide_ref: (response.action === "show_guide" || response.action === "start_guided") ? response.process_id : undefined,
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
    setGuidedMode(false);
    setOverlayStep(null);
    setGuidedStepNumber(0);
  };

  const analyzeForGuidance = useCallback(async () => {
    if (!stream) return;
    setIsAnalyzingStep(true);
    try {
      const blob = await captureScreenshot();
      if (!blob) return;
      const file = new File([blob], "guided-step.jpg", { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un tutor de software experto con visión computacional. El usuario está compartiendo su pantalla en vivo y necesita que lo guíes paso a paso con una capa de realidad aumentada sobre su software.

=== TAREA DEL USUARIO ===
${buildContext(messages) || "No hay contexto previo."}

=== PROCESOS DE REFERENCIA ===
${buildProcessList()}

Analizá la captura de pantalla actual con atención al detalle. Necesitás:

1. IDENTIFICAR qué aplicación o sitio web está abierta (Gmail, Excel, Word, un sistema interno, etc.)
2. LEER el texto visible en pantalla: títulos, botones, menús, correos, campos de formulario, pestañas
3. DETERMINAR en qué punto de la tarea está el usuario comparando lo que ves en pantalla con la tarea que quiere completar
4. IDENTIFICAR el elemento exacto con el que debe interactuar ahora para avanzar al siguiente paso

Luego devolvé:

- instruction: instrucción específica y accionable que diga EXACTAMENTE qué hacer y en qué elemento. Ej: "Hacé clic en el botón redactar arriba a la izquierda para crear un nuevo email". NUNCA uses instrucciones genéricas como "Hacé clic aquí". Siempre mencioná el nombre o texto del elemento visible.
- target_description: el nombre o texto EXACTO del botón, menú o elemento que el usuario debe clickear, tal como aparece en pantalla. Ej: "Botón Redactar", "Campo Para:", "Botón CCO". NUNCA dejes esto vacío ni genérico.
- bounding_box: coordenadas del elemento como porcentajes (0-100) donde x,y es la esquina superior izquierda y width,height son el tamaño del recuadro que rodea el elemento a clickear
- what_you_see: descripción breve de lo que identificaste en pantalla (ej: "Gmail inbox con lista de correos, botón redactar arriba")
- is_final: true si la tarea ya está completa según lo que ves en pantalla

Si no podés identificar el elemento o el usuario ya terminó, explicalo en la instrucción.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            instruction: { type: "string" },
            target_description: { type: "string" },
            what_you_see: { type: "string" },
            bounding_box: {
              type: "object",
              properties: {
                x: { type: "number" },
                y: { type: "number" },
                width: { type: "number" },
                height: { type: "number" }
              },
              required: ["x", "y", "width", "height"]
            },
            is_final: { type: "boolean" }
          },
          required: ["instruction", "target_description", "what_you_see", "bounding_box", "is_final"]
        },
        model: "claude_sonnet_4_6",
      });

      setOverlayStep(response);
    } catch (err) {
      setOverlayStep(null);
    } finally {
      setIsAnalyzingStep(false);
    }
  }, [stream, messages, processes, captureScreenshot]);

  const startGuidedMode = useCallback(() => {
    setGuidedMode(true);
    setGuidedStepNumber(1);
    setOverlayStep(null);
    analyzeForGuidance();
  }, [analyzeForGuidance]);

  const nextGuidedStep = useCallback(() => {
    if (overlayStep?.is_final) {
      stopGuidedMode();
      return;
    }
    setGuidedStepNumber((prev) => prev + 1);
    setOverlayStep(null);
    analyzeForGuidance();
  }, [overlayStep, analyzeForGuidance]);

  const stopGuidedMode = () => {
    setGuidedMode(false);
    setOverlayStep(null);
    setGuidedStepNumber(0);
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
              guidedMode={guidedMode}
              overlayStep={overlayStep}
              guidedStepNumber={guidedStepNumber}
              isAnalyzingStep={isAnalyzingStep}
              onStartGuidedMode={startGuidedMode}
              onNextGuidedStep={nextGuidedStep}
              onStopGuidedMode={stopGuidedMode}
              interactiveContent={activeInteractive}
              onSimulationEvent={handleSimulationEvent}
            />
          </div>
        </div>
      )}
    </div>
  );
}