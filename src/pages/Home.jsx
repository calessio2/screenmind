import React, { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ConversationSidebar from "@/components/screen-agent/ConversationSidebar";
import ChatPanel from "@/components/screen-agent/ChatPanel";
import ScreenPreview from "@/components/screen-agent/ScreenPreview";
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
  const videoRef = useRef(null);
  const canvasRef = useRef(document.createElement("canvas"));

  // Load conversations
  useEffect(() => {
    base44.entities.Conversation.list("-created_date", 50).then(setConversations);
  }, []);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConvId) {
      const conv = conversations.find((c) => c.id === activeConvId);
      setMessages(conv?.messages || []);
    } else {
      setMessages([]);
    }
  }, [activeConvId, conversations]);

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
    await base44.entities.Conversation.update(convId, { messages: newMessages });
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, messages: newMessages } : c))
    );
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

  const analyzeScreenshot = useCallback(async () => {
    if (!activeConvId || !stream) return;
    setIsCapturing(true);

    try {
      const blob = await captureScreenshot();
      if (!blob) return;

      const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      const contextMessages = messages.slice(-6).map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');

      const userMsg = {
        role: "user",
        content: "📸 [Captura de pantalla enviada para análisis]",
        timestamp: new Date().toISOString(),
        has_screenshot: true,
      };
      const updated = [...messages, userMsg];
      setMessages(updated);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un asistente experto que guía al usuario paso a paso según lo que ve en su pantalla. Analizá esta captura de pantalla y decile al usuario qué está viendo y qué pasos seguir.

Contexto previo de la conversación:
${contextMessages || "No hay contexto previo."}

Respondé en español, de forma clara y concisa. Usá formato markdown con pasos numerados si corresponde. Sé específico sobre lo que ves en la pantalla: botones, menús, textos, etc.`,
        file_urls: [file_url],
        model: "claude_sonnet_4_6",
      });

      const assistantMsg = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
        has_screenshot: false,
      };
      const final = [...updated, assistantMsg];
      setMessages(final);
      await saveMessages(activeConvId, final);
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
  }, [activeConvId, stream, messages, captureScreenshot]);

  const sendTextMessage = useCallback(async (text) => {
    if (!activeConvId) return;
    setIsLoading(true);

    const userMsg = { role: "user", content: text, timestamp: new Date().toISOString() };
    const updated = [...messages, userMsg];
    setMessages(updated);

    try {
      let file_urls = [];

      // If screen is shared, also capture and include it
      if (stream) {
        const blob = await captureScreenshot();
        if (blob) {
          const file = new File([blob], "screenshot.jpg", { type: "image/jpeg" });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          file_urls = [file_url];
        }
      }

      const contextMessages = messages.slice(-6).map(m => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Sos un asistente experto que guía al usuario paso a paso. El usuario te escribió un mensaje${file_urls.length ? " y compartió una captura de su pantalla" : ""}.

Contexto previo:
${contextMessages || "No hay contexto previo."}

Mensaje del usuario: ${text}

Respondé en español, de forma clara y concisa. Usá markdown con pasos numerados si corresponde. Si hay una captura de pantalla, referite a lo que ves en ella.`,
        file_urls: file_urls.length ? file_urls : undefined,
        model: file_urls.length ? "claude_sonnet_4_6" : "automatic",
      });

      const assistantMsg = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      const final = [...updated, assistantMsg];
      setMessages(final);
      await saveMessages(activeConvId, final);
    } catch (err) {
      const errorMsg = {
        role: "assistant",
        content: "❌ Hubo un error al procesar tu mensaje. Intentá de nuevo.",
        timestamp: new Date().toISOString(),
      };
      const final = [...updated, errorMsg];
      setMessages(final);
      await saveMessages(activeConvId, final);
    } finally {
      setIsLoading(false);
    }
  }, [activeConvId, messages, stream, captureScreenshot]);

  const startSharing = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: false,
      });
      setStream(mediaStream);
      setIsSharing(true);
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
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 bg-zinc-800 p-2 rounded-lg text-zinc-300"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-200 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}>
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConvId}
          onSelect={(id) => { setActiveConvId(id); setSidebarOpen(false); }}
          onCreate={createConversation}
          onDelete={deleteConversation}
        />
      </div>

      {/* Backdrop */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />
      )}

      {/* Main content */}
      {!activeConvId ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-zinc-800/60 flex items-center justify-center mb-6">
              <span className="text-4xl">🖥️</span>
            </div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-2">Asistente de Pantalla</h1>
            <p className="text-zinc-500 mb-6 max-w-sm mx-auto text-sm">
              Compartí tu pantalla y recibí instrucciones paso a paso de un agente de IA en tiempo real.
            </p>
            <button
              onClick={createConversation}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition-colors"
            >
              Iniciar nueva sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row gap-3 p-3 lg:pl-3 pl-3 pt-14 lg:pt-3 min-h-0">
          {/* Chat Panel */}
          <div className="lg:w-[420px] w-full flex-shrink-0 min-h-0 h-[45vh] lg:h-auto">
            <ChatPanel
              messages={messages}
              onSendMessage={sendTextMessage}
              isLoading={isLoading}
            />
          </div>

          {/* Screen Preview */}
          <div className="flex-1 min-h-0 h-[45vh] lg:h-auto">
            <ScreenPreview
              stream={stream}
              isSharing={isSharing}
              onStartSharing={startSharing}
              onStopSharing={stopSharing}
              onCapture={analyzeScreenshot}
              isCapturing={isCapturing}
            />
          </div>
        </div>
      )}
    </div>
  );
}