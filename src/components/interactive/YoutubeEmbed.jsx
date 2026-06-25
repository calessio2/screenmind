import React from "react";

export default function YoutubeEmbed({ config }) {
  const extractVideoId = (input) => {
    if (!input) return null;
    const trimmed = input.trim();
    // Already an ID (11 chars, no slashes)
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    // youtu.be/ID
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];
    // youtube.com/watch?v=ID or embed/ID or short/ID
    const longMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || trimmed.match(/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
    if (longMatch) return longMatch[1];
    return null;
  };

  const videoId = extractVideoId(config?.youtube_id);
  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        No se pudo extraer el video de YouTube del link proporcionado.
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-zinc-950">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs text-zinc-400 font-medium">Video de YouTube</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-2">
        <div className="w-full h-full max-w-4xl aspect-video">
          <iframe
            className="w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${videoId}`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}