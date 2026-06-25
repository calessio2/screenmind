import React from "react";

export default function YoutubeEmbed({ config }) {
  const videoId = config?.youtube_id;
  if (!videoId) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-600 text-sm">
        No se configuró un video de YouTube.
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