import React from "react";

export default function YoutubeEmbed({ config }) {
  const extractVideoId = (input) => {
    if (!input) return null;
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    try {
      const url = new URL(trimmed);
      if (url.hostname === "youtu.be") {
        const id = url.pathname.split("/").filter(Boolean)[0];
        if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
      }
      if (url.hostname.includes("youtube.com")) {
        const v = url.searchParams.get("v");
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
        const pathMatch = url.pathname.match(/\/(?:embed|shorts)\/([a-zA-Z0-9_-]{11})/);
        if (pathMatch) return pathMatch[1];
      }
    } catch (e) {
      // not a URL — try regex
    }
    const m = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const videoId = extractVideoId(config?.youtube_id);
  if (!videoId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-sm gap-2 p-6">
        <p>No se pudo extraer el ID del video del link proporcionado.</p>
        <p className="text-xs text-zinc-700">Asegurate de usar un link válido de YouTube.</p>
      </div>
    );
  }
  const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
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
            src={embedSrc}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}