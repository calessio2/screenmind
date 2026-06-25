import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

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

async function tryDirectTranscript(videoId) {
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
    // Check if IP was blocked (ip=0.0.0.0)
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
            const t = data.events
              .filter(e => e.segs)
              .map(e => e.segs.map(s => s.utf8 || '').join(''))
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (t) return t;
          }
        } else {
          const matches = text.matchAll(/<text[^>]*>(.*?)<\/text>/g);
          const parts = Array.from(matches).map(m => m[1]);
          if (parts.length > 0) {
            const t = parts
              .map(s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"))
              .join(' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (t) return t;
          }
        }
      } catch (e) {}
    }
  }
  return null;
}

async function tryLLMTranscript(base44, videoId, youtube_url) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Buscá en internet información detallada sobre el contenido del video de YouTube con ID ${videoId} (URL: ${youtube_url}).

Extraé y estructurá:
1. Un resumen detallado de qué trata el video y qué explica
2. Los pasos o instrucciones específicas que se muestran (si es un tutorial)
3. Los conceptos clave y temas cubiertos
4. Cualquier tip, advertencia o buena práctica mencionada

Si el video es un tutorial paso a paso, listá cada paso en orden. Si es educativo, explicá los conceptos principales. La idea es que esta información sirva como referencia para que un tutor de software pueda responder preguntas sobre el contenido del video sin necesidad de verlo.`,
    add_context_from_internet: true,
    model: 'gemini_3_1_pro',
    response_json_schema: {
      type: "object",
      properties: {
        content_summary: { type: "string", description: "Resumen detallado del contenido del video, pasos e instrucciones" }
      },
      required: ["content_summary"]
    }
  });
  return result?.content_summary || null;
}

Deno.serve(async (req) => {
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

    // Try direct transcript first
    let transcript = await tryDirectTranscript(videoId);
    let source = 'direct';

    // Fallback to LLM with web search
    if (!transcript) {
      transcript = await tryLLMTranscript(base44, videoId, youtube_url);
      source = 'llm_summary';
    }

    if (!transcript) {
      return Response.json({
        error: 'No se pudo obtener el contenido del video. Asegurate de que el video tenga subtítulos (CC) o que sea un video público con contenido indexable.',
        videoId
      }, { status: 500 });
    }

    const trimmedTranscript = transcript.substring(0, 10000);

    await base44.asServiceRole.entities.InteractiveContent.update(content_id, {
      transcript: trimmedTranscript
    });

    return Response.json({
      success: true,
      transcript_length: transcript.length,
      source,
      videoId
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});