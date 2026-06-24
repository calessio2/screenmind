import React from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User, BookOpen, Camera } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? "bg-white/[0.08] text-zinc-300" : "bg-white/[0.06] text-zinc-400"
      }`}>
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>
      <div className={`max-w-[80%] px-3.5 py-2.5 ${
        isUser
          ? "bg-white text-zinc-950 rounded-2xl rounded-tr-md"
          : "bg-white/[0.04] text-zinc-200 rounded-2xl rounded-tl-md"
      }`}>
        {message.guide_ref && !isUser && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 mb-1.5">
            <BookOpen className="w-3 h-3" />
            Guía mostrada en el panel →
          </span>
        )}
        {message.request_screenshot && !isUser && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-400 mb-1.5">
            <Camera className="w-3 h-3" />
            El tutor solicita ver tu pantalla →
          </span>
        )}
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-li:leading-relaxed prose-headings:text-zinc-100">
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}