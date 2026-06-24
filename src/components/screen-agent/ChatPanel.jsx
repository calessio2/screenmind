import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import MessageBubble from "./MessageBubble";

export default function ChatPanel({ messages, onSendMessage, onSendImage, isLoading }) {
  const [input, setInput] = useState("");
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImageUrl, setPendingImageUrl] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type.startsWith("image/")) {
      setPendingImage(file);
      setPendingImageUrl(URL.createObjectURL(file));
    } else {
      onSendMessage(`📎 Archivo adjunto: ${file.name}`);
    }
    e.target.value = "";
  };

  const handleSendImage = () => {
    if (!pendingImage || isLoading) return;
    onSendImage(pendingImage);
    setPendingImage(null);
    setPendingImageUrl(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/[0.06]">
        <h2 className="text-sm font-medium text-zinc-200">Tutor de Adopción Digital</h2>
        <p className="text-[11px] text-zinc-600 mt-0.5">Tu guía inteligente para software y procesos</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
              <span className="text-xl">🎓</span>
            </div>
            <p className="text-zinc-300 text-sm font-medium mb-1.5">¡Hola! Soy tu Tutor Digital</p>
            <p className="text-zinc-600 text-xs max-w-xs leading-relaxed">
              Preguntame cómo usar un software, seguir un proceso o resolver un problema. También puedo pedirte que compartas tu pantalla si necesitás que te guíe en vivo.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
              <Loader2 className="w-3.5 h-3.5 text-zinc-500 animate-spin" />
            </div>
            <div className="bg-white/[0.04] rounded-2xl rounded-tl-md px-4 py-3.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {pendingImage && (
        <div className="px-3 py-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 bg-white/[0.04] rounded-lg p-2">
            <img src={pendingImageUrl} alt="preview" className="w-10 h-10 rounded object-cover" />
            <span className="text-xs text-zinc-400 flex-1 truncate">{pendingImage.name}</span>
            <button
              onClick={() => { setPendingImage(null); setPendingImageUrl(null); }}
              className="text-zinc-600 hover:text-zinc-300 text-xs"
            >
              Cancelar
            </button>
            <Button
              size="sm"
              onClick={handleSendImage}
              disabled={isLoading}
              className="bg-white text-zinc-950 hover:bg-zinc-200 h-7 px-3 text-xs"
            >
              Enviar
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-3 py-3 border-t border-white/[0.06]">
        <div className="flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors disabled:opacity-30"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu consulta..."
            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white/[0.12] transition-colors"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-white text-zinc-950 hover:bg-zinc-200 rounded-xl px-3 disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}