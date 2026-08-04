import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

function extractVideoId(input) {
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
}

function formatTimestamp(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function extractCaptionTracks(html) {
  const marker = '"captionTracks":';
  const idx = html.indexOf(marker);
  if (idx === -1) return [];
  const start = idx + marker.length;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < html.length; i++) {
    const char = html[i];
    if (escape) { escape = false; continue; }
    if (char === '\\') { escape = true; continue; }
    if (char === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (char === '[') depth++;
    if (char === ']') { depth--; if (depth === 0) {
      const jsonStr = html.substring(start, i + 1);
      try { return JSON.parse(jsonStr); } catch (e) { return []; }
    }}
  }
  return [];
}

async function fetchTimestampedTranscript(videoId) {
  const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    }
  });
  const html = await pageResponse.text();

  const captionTracks = extractCaptionTracks(html);
  if (!captionTracks || captionTracks.length === 0) return null;

  const sortedTracks = [...captionTracks].sort((a, b) => {
    const aEs = a.languageCode?.startsWith('es') ? 0 : 1;
    const bEs = b.languageCode?.startsWith('es') ? 0 : 1;
    return aEs - bEs;
  });

  for (const track of sortedTracks) {
    if (track.baseUrl.includes('ip=0.0.0.0')) continue;

    for (const fmt of ['json3', 'srv3', '']) {
      try {
        const url = fmt ? track.baseUrl + `&fmt=${fmt}` : track.baseUrl;
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        const text = await resp.text();
        if (!text || text.length === 0) continue;

        if (fmt === 'json3') {
          const data = JSON.parse(text);
          if (data.events) {
            const segments = data.events
              .filter(e => e.segs && e.tStartMs !== undefined)
              .map(e => {
                const secs = Math.floor(e.tStartMs / 1000);
                const txt = e.segs.map(s => s.utf8 || '').join('').replace(/\s+/g, ' ').trim();
                return { start_seconds: secs, text: txt };
              })
              .filter(s => s.text);
            if (segments.length > 0) return segments;
          }
        } else {
          const matches = Array.from(text.matchAll(/<text start="([\d.]+)"[^>]*>(.*?)<\/text>/g));
          if (matches.length > 0) {
            const segments = matches.map(m => {
              const secs = Math.floor(parseFloat(m[1]));
              const txt = m[2]
                .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
                .replace(/\s+/g, ' ').trim();
              return { start_seconds: secs, text: txt };
            }).filter(s => s.text);
            if (segments.length > 0) return segments;
          }
        }
      } catch (e) {}
    }
  }
  return null;
}

function extractChaptersFromPage(html) {
  // YouTube stores chapters in ytInitialData as chapterRenderer objects
  const chapterRegex = /"chapterRenderer":\{"title":\{"(?:simpleText|runs)":\[?\{?"?(?:text|simpleText)?"?:?"([^"]+)"[^}]*"timeRangeStartMillis":(\d+)/g;
  const matches = Array.from(html.matchAll(chapterRegex));
  if (matches.length === 0) return null;

  const sections = matches.map((m, idx) => {
    const title = m[1];
    const startMs = parseInt(m[2], 10);
    const startSeconds = Math.floor(startMs / 1000);
    const endSeconds = idx + 1 < matches.length
      ? Math.floor(parseInt(matches[idx + 1][2], 10) / 1000)
      : startSeconds + 300;
    return {
      title,
      start_seconds: startSeconds,
      end_seconds: endSeconds,
      description: "",
      keywords: title.toLowerCase()
    };
  });
  return sections;
}

async function fetchPageHtml(videoId) {
  const pageResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    }
  });
  return await pageResponse.text();
}

async function generateSectionsViaLLM(base44, videoId, youtube_url) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Buscá en internet información detallada sobre el contenido del video de YouTube con ID ${videoId} (URL: ${youtube_url}).

Necesitás dividir el video en secciones temáticas con timestamps aproximados. Si encontrás información sobre los capítulos del video (timestamps en la descripción o en comentarios), usalos. Si no, estimá secciones lógicas basándote en el contenido que encuentres.

Cada sección debe tener:
- title: título corto y descriptivo (máx 8 palabras) en español
- start_seconds: tiempo de inicio en segundos (número entero, estimado si no hay datos exactos)
- end_seconds: tiempo de fin en segundos (número entero)
- description: descripción breve de qué se explica (1-2 frases) en español
- keywords: palabras clave separadas por comas

Generá entre 5 y 15 secciones según la duración y complejidad del video.`,
    add_context_from_internet: true,
    model: 'gemini_3_1_pro',
    response_json_schema: {
      type: "object",
      properties: {
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              start_seconds: { type: "number" },
              end_seconds: { type: "number" },
              description: { type: "string" },
              keywords: { type: "string" }
            },
            required: ["title", "start_seconds"]
          }
        },
        transcript_summary: { type: "string", description: "Resumen del contenido del video" }
      },
      required: ["sections"]
    }
  });
  return result;
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { content_id, youtube_url } = await req.json();
    if (!content_id || !youtube_url) {
      return Response.json({ error: 'content_id and youtube_url are required' }, { status: 400 });
    }

    const videoId = extractVideoId(youtube_url);
    if (!videoId) return Response.json({ error: 'URL de YouTube inválida' }, { status: 400 });

    let sections = null;
    let transcript = null;
    let source = null;

    // Strategy 1: Try timestamped transcript from captions
    try {
      const segments = await fetchTimestampedTranscript(videoId);
      if (segments && segments.length > 0) {
        const timestampedText = segments
          .map(s => `[${formatTimestamp(s.start_seconds)}] ${s.text}`)
          .join('\n')
          .substring(0, 12000);
        transcript = segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim().substring(0, 10000);

        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Analizá la siguiente transcripción de un video de YouTube con timestamps y dividila en secciones temáticas lógicas (capítulos).

Transcripción con timestamps:
${timestampedText}

Instrucciones:
- Creá secciones que agrupen temas coherentes.
- Cada sección debe tener: title (máx 8 palabras, en español), start_seconds (entero), end_seconds (entero), description (1-2 frases, en español), keywords (separadas por comas).
- Los start_seconds deben coincidir con los timestamps de la transcripción.
- Cubrí todo el video sin superposiciones ni huecos grandes.`,
          response_json_schema: {
            type: "object",
            properties: {
              sections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    start_seconds: { type: "number" },
                    end_seconds: { type: "number" },
                    description: { type: "string" },
                    keywords: { type: "string" }
                  },
                  required: ["title", "start_seconds"]
                }
              }
            },
            required: ["sections"]
          }
        });
        sections = result?.sections || [];
        source = 'transcript';
      }
    } catch (e) {}

    // Strategy 2: Extract chapters from YouTube page (description/ytInitialData)
    if (!sections || sections.length === 0) {
      try {
        const html = await fetchPageHtml(videoId);
        const pageChapters = extractChaptersFromPage(html);
        if (pageChapters && pageChapters.length > 0) {
          sections = pageChapters;
          source = 'youtube_chapters';
          if (!transcript) transcript = '';
        }
      } catch (e) {}
    }

    // Strategy 3: LLM with web search
    if (!sections || sections.length === 0) {
      const result = await generateSectionsViaLLM(base44, videoId, youtube_url);
      sections = result?.sections || [];
      transcript = result?.transcript_summary || transcript || '';
      source = 'llm_web';
    }

    if (!sections || sections.length === 0) {
      return Response.json({
        error: 'No se pudieron generar secciones para este video. Verificá que el video sea público y accesible.'
      }, { status: 500 });
    }

    const existing = await base44.asServiceRole.entities.InteractiveContent.get(content_id);
    const existingConfig = existing?.config || {};

    const updateData = {
      config: {
        ...existingConfig,
        youtube_id: existingConfig.youtube_id || youtube_url,
        video_sections: sections
      }
    };
    if (transcript) updateData.transcript = transcript.substring(0, 10000);

    await base44.asServiceRole.entities.InteractiveContent.update(content_id, updateData);

    return Response.json({
      success: true,
      sections_count: sections.length,
      source,
      sections
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}