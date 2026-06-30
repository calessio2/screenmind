import React from "react";
import YoutubeEmbed from "./YoutubeEmbed";
import EmailSimulator from "./EmailSimulator";
import DragDropGame from "./DragDropGame";
import { Sparkles } from "lucide-react";

export default function InteractiveContentViewer({ content, onProgress }) {
  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-zinc-950 p-6">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-zinc-700" />
        </div>
        <p className="text-zinc-600 text-xs text-center max-w-xs">
          Seleccioná un contenido de la biblioteca para empezar.
        </p>
      </div>
    );
  }

  switch (content.type) {
    case "youtube":
      return <YoutubeEmbed config={content.config} />;
    case "email_simulator":
      return <EmailSimulator content={content} onProgress={onProgress} />;
    case "drag_drop_game":
      return <DragDropGame config={content.config} />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
          Tipo de contenido no soportado: {content.type}
        </div>
      );
  }
}