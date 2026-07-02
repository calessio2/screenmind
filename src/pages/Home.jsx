import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ConversationSidebar from "@/components/screen-agent/ConversationSidebar";
import ChatPanel from "@/components/screen-agent/ChatPanel";
import DynamicPanel from "@/components/screen-agent/DynamicPanel";
import { Menu, X } from "lucide-react";
import { useAgentChat } from "@/hooks/useAgentChat";

export default function Home() {
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
  const [simulationContext, setSimulationContext] = useState(null);
  const [userGoals, setUserGoals] = useState([]);
  const canvasRef = useRef(document.createElement("canvas"));
  const pendingPromptRef = useRef(null);

  const {
    conversations,
    activeConvId,
    messages,
    isLoading,
    selectConversation,
    createConversation: createAgentConversation,
    deleteConversation,
    sendMessage: sendAgentMessage,
  } = useAgentChat("lip_tutor");

  const fetchUserGoals = useCallback(() => {
    base44.entities.Goal.filter({ status: "active" }).then((goals) => {
      setUserGoals(goals || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    base44.entities.Process.filter({ status: "active" }).then(setProcesses).catch(() => {});
    base44.entities.InteractiveContent.filter({ status: "active" }).then(setInteractiveContents).catch(() => {});
    base44.auth.me().then((u) => {
      setUser(u);
      if (u?.id) fetchUserGoals();
    }).catch(() => {});

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
    const promptParam = urlParams.get("prompt");
    if (promptParam) {
      pendingPromptRef.current = promptParam;
      createAgentConversation();
    }
  }, []);

  // Reset panel when conversation changes
  useEffect(() => {
    setPanelMode("default");
    setActiveProcess(null);
    setActiveInteractive(null);
    setScreenshotRequested(false);
    setSimulationContext(null);
    fetchUserGoals();
  }, [activeConvId, fetchUserGoals]);

  // Send pending prompt when conversation is created
  useEffect(() => {
    if (!activeConvId || !pendingPromptRef.current) return;
    const prompt = pendingPromptRef.current;
    pendingPromptRef.current = null;
    handleSendMessage(prompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId]);

  // Parse agent messages for content references and actions
  useEffect(() => {
    if (!messages.length) return;
    const lastAssistantMsg = [...messages].reverse().find(m => m.role === "assistant");
    if (!lastAssistantMsg) return;

    const content = lastAssistantMsg.content || "";

    const contentMatch = content.match(/\[CONTENT:([^\]]+)\]/);
    if (contentMatch) {
      const contentId = contentMatch[1];
      const contentItem = interactiveContents.find(c => c.id === contentId);
      if (contentItem) {
        setActiveInteractive(contentItem);
        setPanelMode("interactive");
      } else {
        base44.entities.InteractiveContent.get(contentId).then((item) => {
          if (item) {
            setActiveInteractive(item);
            setPanelMode("interactive");
          }
        }).catch(() => {});
      }
    }

    // Fallback: si el agente olvidó el tag [CONTENT:id] pero mencionó un título con intención de abrir
    if (!contentMatch && interactiveContents.length) {
      const intent = /\b(abro|abrir|abr[ií]|lanzo|inici[aá]|empez[aá]|practic[aá]|te lo abro)\b/i.test(content);
      if (intent) {
        const lower = content.toLowerCase();
        const matched = interactiveContents.find(c => c.title && lower.includes(c.title.toLowerCase()));
        if (matched) {
          setActiveInteractive(matched);
          setPanelMode("interactive");
        }
      }
    }
    // Fallback similar para guías
    if (!processMatch && processes.length) {
      const intent = /\b(abro|abrir|abr[ií]|lanzo|inici[aá]|empez[aá]|te lo abro)\b/i.test(content);
      if (intent) {
        const lower = content.toLowerCase();
        const matched = processes.find(p => p.title && lower.includes(p.title.toLowerCase()));
        if (matched) {
          setActiveProcess(matched);
          setActiveStepIndex(0);
          setPanelMode("guide");
        }
      }
    }

    const processMatch = content.match(/\[PROCESS:([^\]]+)\]/);
    if (processMatch) {
      const processId = processMatch[1];
      const process = processes.find(p => p.id === processId);
      if (process) {
        setActiveProcess(process);
        setActiveStepIndex(0);
        setPanelMode("guide");
      } else {
        base44.entities.Process.get(processId).then((item) => {
          if (item) {
            setActiveProcess(item);
            setActiveStepIndex(0);
            setPanelMode("guide");
          }
        }).catch(() => {});
      }
    }

    if (content.includes("[REQUEST_SCREEN]")) {
      setPanelMode("screen");
      setScreenshotRequested(true);
    }
  }, [messages, interactiveContents, processes]);

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

  const buildContextPrefix = useCallback(() => {
    if (panelMode === "interactive" && activeInteractive) {
      const c = activeInteractive;
      let ctx = `[CONTEXTO: El usuario tiene abierto el contenido "${c.title}" (tipo: ${c.type}`;
      if (c.description) ctx += `. Descripción: ${c.description}`;
      if (c.software) ctx += `. Software: ${c.software}`;
      if (c.type === "email_simulator" && simulationContext) {
        const target = c.config?.email_scenario?.target_action || "completar el email";
        const stepsStr = simulationContext.steps?.map(s => `${s.done ? "✓" : "○"} ${s.label}`).join("; ");
        ctx += `. Tarea: ${target}. Progreso: ${simulationContext.completed}/${simulationContext.total}. Pasos: ${stepsStr}]`;
      } else if (c.type === "youtube") {
        const ytId = c.config?.youtube_id || "";
        ctx += `. Video de YouTube${ytId ? ` (${ytId})` : ""}${c.transcript ? ". Transcripción disponible en el campo transcript del contenido." : ""}]`;
      } else if (c.type === "drag_drop_game") {
        const items = c.config?.game_items?.length || 0;
        const zones = c.config?.zones?.length || 0;
        ctx += `. Juego de clasificación con ${items} elementos y ${zones} categorías.]`;
      } else if (c.type === "signature_simulator") {
        const target = c.config?.email_scenario?.target_action || "configurar una firma";
        ctx += `. Tarea: ${target}]`;
      } else {
        ctx += `]`;
      }
      return ctx + "\n\n";
    }
    if (panelMode === "guide" && activeProcess) {
      const total = activeProcess.steps?.length || 0;
      const step = activeProcess.steps?.[activeStepIndex];
      let ctx = `[CONTEXTO: El usuario está viendo la guía "${activeProcess.title}", paso ${activeStepIndex + 1} de ${total}`;
      if (step) ctx += `. Paso actual: ${step.title}. ${step.description || ""}`;
      ctx += `]`;
      return ctx + "\n\n";
    }
    if (panelMode === "screen" && isSharing) {
      return `[CONTEXTO: El usuario está compartiendo su pantalla.]\n\n`;
    }
    return "";
  }, [panelMode, activeInteractive, activeProcess, activeStepIndex, isSharing, simulationContext]);

  const buildGoalsContext = useCallback(() => {
    if (!userGoals.length || !user?.id) return "";
    const goalsSummary = userGoals
      .filter(g => g.assigned_to_id === user.id)
      .map(g => {
        const totalSteps = g.steps?.length || 0;
        const completedSteps = g.steps?.filter(s => s.completed)?.length || 0;
        const pendingSteps = g.steps?.filter(s => !s.completed)?.map(s => s.title).join(", ") || "sin pasos definidos";
        return `- "${g.title}" (categoría: ${g.category || "general"}, progreso: ${completedSteps}/${totalSteps} hitos, vence: ${g.due_date || "sin fecha"}). Pendiente: ${pendingSteps}`;
      }).join("\n");
    if (!goalsSummary) return "";
    return `[OBJETIVOS DEL USUARIO: El usuario tiene estos objetivos de aprendizaje activos:\n${goalsSummary}\nUsá esta info para contextualizar respuestas. Si el usuario pregunta por "el plan", sus objetivos, o qué le toca aprender, referite a estos datos.]\n\n`;
  }, [userGoals, user]);

  const handleSendMessage = async (text, image) => {
    if (!activeConvId) return;
    let fileUrls = null;

    const contextPrefix = buildGoalsContext() + buildContextPrefix();

    if (image) {
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: image });
        fileUrls = [file_url];
      } catch (e) {}
    }

    if (isSharing && !image) {
      try {
        const blob = await captureScreenshot();
        if (blob) {
          const file = new File([blob], "screen.jpg", { type: "image/jpeg" });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          fileUrls = [file_url];
        }
      } catch (e) {}
    }

    await sendAgentMessage(contextPrefix + text, fileUrls);
  };

  const handleManualCapture = useCallback(async () => {
    if (!activeConvId || !stream) return;
    setIsCapturing(true);
    try {
      const blob = await captureScreenshot();
      if (!blob) return;
      const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setScreenshotRequested(false);
      await sendAgentMessage("📸 Analizá esta captura de mi pantalla y decime cómo seguir.", [file_url]);
    } catch (e) {} finally {
      setIsCapturing(false);
    }
  }, [activeConvId, stream, captureScreenshot, sendAgentMessage]);

  const handleSimulationEvent = useCallback(async (event) => {
    if (event.type === "progress") {
      setSimulationContext(event);
      return;
    }
    if (event.type === "finish") {
      setPanelMode("default");
      setActiveInteractive(null);
      setSimulationContext(null);
      return;
    }
    if (!activeConvId) return;
    if (event.type === "success") {
      setSimulationContext(null);
      await sendAgentMessage("✅ Completé la simulación correctamente. Actualizá mi progreso en los objetivos correspondientes.");
    } else if (event.type === "error") {
      const errorList = event.errors.map(e => `- ${e}`).join("\n");
      await sendAgentMessage(`❌ Tuve errores en la simulación:\n${errorList}\n\nAyudame a entender cómo corregirlos.`);
    }
  }, [activeConvId, sendAgentMessage]);

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
    } catch (err) {}
  };

  const stopSharing = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    setStream(null);
    setIsSharing(false);
  };

  const createConversation = async () => {
    await createAgentConversation();
    setSidebarOpen(false);
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
          onSelect={(id) => { selectConversation(id); setSidebarOpen(false); }}
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
              onSendMessage={handleSendMessage}
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
              onCapture={handleManualCapture}
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