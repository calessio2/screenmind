import React, { useState, useEffect } from "react";
import { List, Play, Clock } from "lucide-react";

function formatTime(seconds) {
  if (seconds == null || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function YoutubeEmbed({ config, activeSection }) {
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
    } catch (e) {}
    const m = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/) || trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const videoId = extractVideoId(config?.youtube_id);
  const sections = config?.video_sections || [];
  const [selectedSection, setSelectedSection] = useState(
    activeSection != null ? activeSection : null
  );
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (activeSection != null && activeSection !== selectedSection) {
      setSelectedSection(activeSection);
      setIframeKey((k) => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection]);

  const handleSelectSection = (idx) => {
    setSelectedSection(idx);
    setIframeKey((k) => k + 1);
  };

  if (!videoId) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-sm gap-2 p-6">
        <p>No se pudo extraer el ID del video del link proporcionado.</p>
        <p className="text-xs text-zinc-700">Asegurate de usar un link válido de YouTube.</p>
      </div>
    );
  }

  const currentSection = selectedSection != null ? sections[selectedSection] : null;
  const startTime = currentSection?.start_seconds || 0;

  let embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;
  if (startTime > 0) embedSrc += `&start=${startTime}`;
  if (currentSection) embedSrc += `&autoplay=1`;

  return (
    <div className="flex flex-col h-full bg-black">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-zinc-950">
        <span className="w-2 h-2 rounded-full bg-red-500" />
        <span className="text-xs text-zinc-400 font-medium">Video de YouTube</span>
        {currentSection && (
          <span className="text-xs text-zinc-500 ml-auto truncate max-w-[200px]">
            ▶ {currentSection.title}
          </span>
        )}
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex-shrink-0 p-2">
          <div className="w-full aspect-video max-w-4xl mx-auto">
            <iframe
              key={iframeKey}
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

        {sections.length > 0 && (
          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-black/80 backdrop-blur-sm py-1">
              <List className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-xs font-medium text-zinc-400">Capítulos</span>
              <span className="text-[10px] text-zinc-600 ml-auto">{sections.length} secciones</span>
            </div>
            <div className="space-y-0.5">
              {sections.map((section, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSection(idx)}
              className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-left transition-colors ${
                    selectedSection === idx
                      ? "bg-white/[0.08] text-zinc-100"
                      : "hover:bg-white/[0.04] text-zinc-400"
                  }`}
                >
                  <div className={`flex items-center gap-1 flex-shrink-0 mt-0.5 ${selectedSection === idx ? "text-red-400" : "text-zinc-600"}`}>
                    {selectedSection === idx ? (
                      <Play className="w-3 h-3 fill-current" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    <span className="text-[10px] font-mono">{formatTime(section.start_seconds)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${selectedSection === idx ? "text-zinc-100" : "text-zinc-300"}`}>
                      {section.title}
                    </p>
                    {section.description && (
                      <p className="text-[10px] text-zinc-600 line-clamp-2 leading-relaxed mt-0.5">
                        {section.description}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}