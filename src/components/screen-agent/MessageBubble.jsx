import React from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User, BookOpen, Camera } from "lucide-react";

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        isUser ? "bg-blue-600/20 text-blue-400" : "bg-emerald-600/20 text-emerald-400"
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
        isUser
          ? "bg-blue-600 text-white rounded-tr-md"
          : "bg-zinc-800 text-zinc-100 rounded-tl-md"
      }`}>
        {message.guide_ref && !isUser && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 mb-1">
            <BookOpen className="w-3 h-3" />
            Guía mostrada en el panel →
          </span>
        )}
        {message.request_screenshot && !isUser && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-amber-400 mb-1">
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