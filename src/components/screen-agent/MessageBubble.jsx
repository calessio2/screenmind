import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Bot, User, ChevronDown, ChevronRight, Wrench, CheckCircle, XCircle, Loader } from "lucide-react";

const STATUS_ICONS = {
  pending: Loader,
  running: Loader,
  in_progress: Loader,
  completed: CheckCircle,
  success: CheckCircle,
  failed: XCircle,
  error: XCircle,
};

const STATUS_COLORS = {
  pending: "text-zinc-500",
  running: "text-blue-400",
  in_progress: "text-blue-400",
  completed: "text-emerald-400",
  success: "text-emerald-400",
  failed: "text-red-400",
  error: "text-red-400",
};

const STATUS_LABELS = {
  pending: "Pendiente",
  running: "Ejecutando",
  in_progress: "Ejecutando",
  completed: "Completado",
  success: "Completado",
  failed: "Error",
  error: "Error",
};

function isFailed(toolCall) {
  if (toolCall.status === "failed" || toolCall.status === "error") return true;
  try {
    const results = typeof toolCall.results === "string" ? JSON.parse(toolCall.results) : toolCall.results;
    if (results && /error|failed/i.test(JSON.stringify(results))) return true;
    if (results && results.success === false) return true;
  } catch (e) {}
  return false;
}

function FunctionDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const failed = isFailed(toolCall);
  const status = failed ? "error" : (toolCall.status || "pending");
  const Icon = STATUS_ICONS[status] || Wrench;
  const color = STATUS_COLORS[status] || "text-zinc-500";
  const label = STATUS_LABELS[status] || status;
  const isRunning = status === "pending" || status === "running" || status === "in_progress";

  const hideDetails = toolCall.display_projection?.hide_details && toolCall.display_projection?.details_redacted;
  const displayLabel = isRunning
    ? (toolCall.display_projection?.active_label || label)
    : failed
      ? (toolCall.display_projection?.error_label || label)
      : (toolCall.display_projection?.label || label);

  const displayName = toolCall.name || "Herramienta";

  let parsedArgs = null;
  try {
    parsedArgs = typeof toolCall.arguments_string === "string" ? JSON.parse(toolCall.arguments_string) : toolCall.arguments_string;
  } catch (e) {
    parsedArgs = toolCall.arguments_string;
  }

  let parsedResults = null;
  try {
    parsedResults = typeof toolCall.results === "string" ? JSON.parse(toolCall.results) : toolCall.results;
  } catch (e) {
    parsedResults = toolCall.results;
  }

  return (
    <div className="mt-2 text-xs border border-white/[0.06] rounded-lg overflow-hidden">
      <button
        onClick={() => !hideDetails && setExpanded(!expanded)}
        className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors ${hideDetails ? "cursor-default" : "cursor-pointer"}`}
      >
        {!hideDetails && (expanded ? <ChevronDown className="w-3 h-3 text-zinc-500" /> : <ChevronRight className="w-3 h-3 text-zinc-500" />)}
        <Icon className={`w-3.5 h-3.5 ${color} ${isRunning ? "animate-spin" : ""}`} />
        <span className="text-zinc-300 capitalize">{displayName}</span>
        <span className={`ml-auto ${color}`}>{displayLabel}</span>
      </button>
      {expanded && !hideDetails && (
        <div className="px-3 py-2 bg-white/[0.02] border-t border-white/[0.06] space-y-2">
          {parsedArgs && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Parámetros</p>
              <pre className="text-zinc-400 text-[11px] overflow-x-auto whitespace-pre-wrap">{JSON.stringify(parsedArgs, null, 2)}</pre>
            </div>
          )}
          {parsedResults && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-zinc-600 mb-1">Resultado</p>
              <pre className="text-zinc-400 text-[11px] overflow-x-auto whitespace-pre-wrap max-h-40 overflow-y-auto">{JSON.stringify(parsedResults, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const cleanContent = (message.content || "").replace(/\[(?:CONTENT|PROCESS|REQUEST_SCREEN):?[^\]]*\]/g, "").trim();

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
        {cleanContent && (
          isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanContent}</p>
          ) : (
            <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none prose-p:leading-relaxed prose-li:leading-relaxed prose-headings:text-zinc-100">
              {cleanContent}
            </ReactMarkdown>
          )
        )}
        {message.tool_calls?.map((toolCall, idx) => (
          <FunctionDisplay key={idx} toolCall={toolCall} />
        ))}
      </div>
    </div>
  );
}