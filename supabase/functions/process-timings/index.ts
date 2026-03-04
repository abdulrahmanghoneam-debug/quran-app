import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Segment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

interface AnalyzedTiming {
  sheikhStart: number;
  childStart: number;
  verseNum: number | null;
  label: string;
}

function isBasmala(text: string): boolean {
  return text.includes("بسم الله الرحمن الرحيم") || text.includes("بسم الله");
}

function isIstiAdha(text: string): boolean {
  return text.includes("أعوذ بالله من الشيطان") || text.includes("أعوذ بالله");
}

function processSegments(segments: Segment[], appSurahId: number, versesCount: number): AnalyzedTiming[] {
  if (segments.length === 0) return [];

  // CRITICAL FIX: Determine which speaker_id is the sheikh
  // The sheikh ALWAYS speaks first in the recording
  const sheikhSpeakerId = segments[0].speaker;

  const timings: AnalyzedTiming[] = [];
  let verseCounter = 0;
  const basmalIsVerse = appSurahId === 1;
  
  let i = 0;
  while (i < segments.length) {
    const seg = segments[i];
    const nextSeg = i + 1 < segments.length ? segments[i + 1] : null;
    const isPair = nextSeg && seg.speaker !== nextSeg.speaker;
    const textIsBasmala = isBasmala(seg.text);
    const textIsIstiAdha = isIstiAdha(seg.text);

    // Determine which segment is sheikh and which is child in a pair
    let sheikhSeg: Segment;
    let childSeg: Segment | null;

    if (isPair) {
      // In a pair, correctly assign based on speaker_id, not position
      if (seg.speaker === sheikhSpeakerId) {
        sheikhSeg = seg;
        childSeg = nextSeg;
      } else {
        // The segments are in wrong order (child first, sheikh second)
        // This can happen when diarization splits segments oddly
        sheikhSeg = nextSeg;
        childSeg = seg;
      }
    } else {
      sheikhSeg = seg;
      childSeg = null;
    }

    const sheikhText = sheikhSeg.text;
    const textCheckBasmala = isBasmala(sheikhText) || (childSeg && isBasmala(childSeg.text));
    const textCheckIstiAdha = isIstiAdha(sheikhText) || (childSeg && isIstiAdha(childSeg.text));
    
    if (textIsIstiAdha || textCheckIstiAdha) {
      timings.push({
        sheikhStart: sheikhSeg.start,
        childStart: childSeg ? childSeg.start : sheikhSeg.start,
        verseNum: null,
        label: "الاستعاذة"
      });
      i += isPair ? 2 : 1;
    } else if (textIsBasmala || textCheckBasmala) {
      if (basmalIsVerse) {
        verseCounter = 1;
        timings.push({
          sheikhStart: sheikhSeg.start,
          childStart: childSeg ? childSeg.start : sheikhSeg.start,
          verseNum: 1,
          label: "1"
        });
      } else {
        timings.push({
          sheikhStart: sheikhSeg.start,
          childStart: childSeg ? childSeg.start : sheikhSeg.start,
          verseNum: null,
          label: "البسملة"
        });
      }
      i += isPair ? 2 : 1;
    } else if (isPair) {
      if (verseCounter < versesCount) {
        verseCounter++;
      }
      timings.push({
        sheikhStart: sheikhSeg.start,
        childStart: childSeg!.start,
        verseNum: verseCounter,
        label: String(verseCounter)
      });
      i += 2;
    } else {
      if (verseCounter < versesCount) {
        verseCounter++;
      }
      timings.push({
        sheikhStart: sheikhSeg.start,
        childStart: sheikhSeg.start,
        verseNum: verseCounter,
        label: String(verseCounter)
      });
      i++;
    }
  }
  
  // Post-processing: ensure sheikhStart < childStart for every entry
  for (const t of timings) {
    if (t.childStart < t.sheikhStart) {
      const temp = t.sheikhStart;
      t.sheikhStart = t.childStart;
      t.childStart = temp;
    }
  }

  // Post-processing: handle split verses
  // When a sheikh splits a long verse into multiple segments, the algorithm
  // creates extra entries. Instead of merging, assign duplicate verseNums.
  const verseTimings = timings.filter(t => t.verseNum !== null);
  const nonVerseTimings = timings.filter(t => t.verseNum === null);
  
  if (verseTimings.length > versesCount) {
    const splitCount = verseTimings.length - versesCount;
    
    // Calculate gaps between consecutive verse entries
    const gaps: { index: number; gap: number }[] = [];
    for (let i = 0; i < verseTimings.length - 1; i++) {
      gaps.push({
        index: i,
        gap: verseTimings[i + 1].sheikhStart - verseTimings[i].sheikhStart
      });
    }
    
    // Calculate median gap to set a smart threshold
    const sortedGapValues = gaps.map(g => g.gap).sort((a, b) => a - b);
    const medianGap = sortedGapValues[Math.floor(sortedGapValues.length / 2)];
    
    // Only consider gaps that are less than 70% of the median as real splits
    // This filters out short consecutive verses that happen to have small gaps
    const threshold = medianGap * 0.7;
    
    // Sort by gap size
    gaps.sort((a, b) => a.gap - b.gap);
    
    // Take only gaps below threshold, up to splitCount
    const validSplits = gaps.filter(g => g.gap < threshold).slice(0, splitCount);
    
    if (validSplits.length > 0) {
      const continuationIndices = new Set(validSplits.map(g => g.index + 1));
      
      let verse = 0;
      for (let i = 0; i < verseTimings.length; i++) {
        if (!continuationIndices.has(i)) {
          verse++;
        }
        verseTimings[i].verseNum = verse;
        verseTimings[i].label = String(verse);
      }
      
      const all = [...nonVerseTimings, ...verseTimings];
      all.sort((a, b) => a.sheikhStart - b.sheikhStart);
      return all;
    }
    // If no valid splits found, cap verse numbers at versesCount (original behavior)
  }

  return timings;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioUrl, appSurahId, versesCount, returnRaw } = await req.json();
    
    const keys = [
      Deno.env.get("ELEVENLABS_API_KEY"),
      Deno.env.get("ELEVENLABS_API_KEY_2"),
      Deno.env.get("ELEVENLABS_API_KEY_3"),
    ].filter(Boolean);

    let lastError = "";
    
    for (const apiKey of keys) {
      try {
        // Download audio
        const audioResp = await fetch(audioUrl);
        if (!audioResp.ok) continue;
        const audioBlob = await audioResp.blob();

        const formData = new FormData();
        formData.append("file", audioBlob, "audio.mp3");
        formData.append("model_id", "scribe_v2");
        formData.append("diarize", "true");
        formData.append("language_code", "ara");

        const sttResp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
          method: "POST",
          headers: { "xi-api-key": apiKey! },
          body: formData,
        });

        if (!sttResp.ok) {
          lastError = await sttResp.text();
          continue;
        }

        const sttData = await sttResp.json();
        
        // Build segments from words
        const segments: Segment[] = [];
        let currentSeg: Segment | null = null;
        
        for (const word of sttData.words || []) {
          if (!currentSeg || word.speaker_id !== currentSeg.speaker) {
            if (currentSeg) segments.push(currentSeg);
            currentSeg = { speaker: word.speaker_id, start: word.start, end: word.end, text: word.text };
          } else {
            currentSeg.end = word.end;
            currentSeg.text += " " + word.text;
          }
        }
        if (currentSeg) segments.push(currentSeg);

        const timings = processSegments(segments, appSurahId, versesCount);

        const response: any = { timings, segmentsCount: segments.length };
        if (returnRaw) {
          response.rawSegments = segments.map(s => ({
            speaker: s.speaker,
            start: s.start,
            end: s.end,
            textPreview: s.text.substring(0, 50)
          }));
        }

        return new Response(JSON.stringify(response), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (e: any) {
        lastError = e.message;
        continue;
      }
    }

    return new Response(JSON.stringify({ error: "All keys failed: " + lastError }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
