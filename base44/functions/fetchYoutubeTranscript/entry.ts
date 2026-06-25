import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { video_id } = await req.json();
    if (!video_id) return Response.json({ error: 'video_id required' }, { status: 400 });

    const headers = {
      'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11)',
      'Content-Type': 'application/json'
    };

    // Use innertube API with ANDROID client — less restrictive than WEB
    const innertubeResp = await fetch('https://www.youtube.com/youtubei/v1/player?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        context: {
          client: { clientName: 'ANDROID', clientVersion: '19.09.37', androidSdkVersion: 30 }
        },
        videoId: video_id
      })
    });

    if (!innertubeResp.ok) return Response.json({ transcript: null, message: `Innertube error: ${innertubeResp.status}` });

    const contentType = innertubeResp.headers.get('content-type') || '';
    if (!contentType.includes('json')) return Response.json({ transcript: null, message: 'Innertube returned non-JSON (possibly rate-limited)' });

    const playerData = await innertubeResp.json();
    const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!tracks || tracks.length === 0) {
      return Response.json({
        transcript: null,
        message: 'No captions available for this video',
        playStatus: playerData?.playabilityStatus?.status
      });
    }

    const track = tracks.find(t => t.languageCode?.startsWith('es')) || tracks[0];
    const transcriptResp = await fetch(track.baseUrl + '&fmt=srv1');
    const xml = await transcriptResp.text();

    const texts = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)].map(m =>
      m[1]
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
    );
    const transcript = texts.join(' ').replace(/\s+/g, ' ').trim();

    return Response.json({ transcript: transcript || null, language: track.languageCode });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});