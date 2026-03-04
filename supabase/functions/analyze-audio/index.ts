import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Word {
  start: number;
  end: number;
  text: string;
  type: string;
  speaker_id: string;
}

interface Segment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

function processWords(words: Word[]): Segment[] {
  const segments: Segment[] = [];
  let currentSpeaker = "";
  let current: Segment | null = null;

  for (const w of words) {
    if (w.type !== "word") continue;
    if (w.speaker_id !== currentSpeaker) {
      if (current) segments.push(current);
      currentSpeaker = w.speaker_id;
      current = { speaker: w.speaker_id, start: w.start, end: w.end, text: w.text };
    } else if (current) {
      current.end = w.end;
      current.text += " " + w.text;
    }
  }
  if (current) segments.push(current);
  return segments;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl } = await req.json();
    if (!audioUrl) {
      return new Response(JSON.stringify({ error: "audioUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try multiple API keys in sequence
    const apiKeys = [
      Deno.env.get("ELEVENLABS_API_KEY"),
      Deno.env.get("ELEVENLABS_API_KEY_2"),
      Deno.env.get("ELEVENLABS_API_KEY_3"),
    ].filter(Boolean) as string[];
    
    if (apiKeys.length === 0) {
      return new Response(
        JSON.stringify({ error: "No ELEVENLABS_API_KEY configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    if (!audioResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to download audio: ${audioResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await audioResponse.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });
    const fileName = audioUrl.split("/").pop() || "audio.mp3";




    // Try each API key until one works
    let sttResponse: Response | null = null;
    let lastError = "";
    
    for (const apiKey of apiKeys) {
      const attemptFormData = new FormData();
      attemptFormData.append("file", audioBlob, fileName);
      attemptFormData.append("model_id", "scribe_v2");
      attemptFormData.append("language_code", "ara");
      attemptFormData.append("tag_audio_events", "false");
      attemptFormData.append("diarize", "true");

      const resp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
        method: "POST",
        headers: { "xi-api-key": apiKey },
        body: attemptFormData,
      });

      if (resp.ok) {
        sttResponse = resp;
        break;
      }
      
      lastError = await resp.text();
      console.log(`API key failed [${resp.status}]: ${lastError}`);
    }

    if (!sttResponse) {
      return new Response(
        JSON.stringify({ error: `All ElevenLabs API keys failed. Last error: ${lastError}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const transcription = await sttResponse.json();
    const segments = processWords(transcription.words);

    return new Response(JSON.stringify({ segments }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
