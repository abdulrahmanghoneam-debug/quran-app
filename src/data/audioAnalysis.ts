// Runtime audio analysis with caching
// Uses static pre-computed timings first, then localStorage cache, then API fallback

import { getStaticTimings } from "./staticTimings";

const CACHE_KEY = "quran-audio-analysis-v3";
const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const AUDIO_BASE = "https://juz-amin-recite.lovable.app";

interface Segment {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

export interface AnalyzedTiming {
  sheikhStart: number;
  childStart: number;
  verseNum: number | null; // null for basmala/isti'adha
  label: string;
}

interface CachedAnalysis {
  [appSurahId: string]: AnalyzedTiming[];
}

function loadCache(): CachedAnalysis {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch {}
  return {};
}

function saveCache(cache: CachedAnalysis) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function isBasmala(text: string): boolean {
  return text.includes("بسم الله الرحمن الرحيم") || text.includes("بسم الله");
}

function isIstiAdha(text: string): boolean {
  return text.includes("أعوذ بالله من الشيطان") || text.includes("أعوذ بالله");
}

function processSegments(segments: Segment[], appSurahId: number, versesCount: number): AnalyzedTiming[] {
  const timings: AnalyzedTiming[] = [];
  let verseCounter = 0;
  // For Al-Fatiha, basmala IS verse 1, so verses start from 2
  const basmalIsVerse = appSurahId === 1;
  
  let i = 0;
  while (i < segments.length) {
    const seg = segments[i];
    const nextSeg = i + 1 < segments.length ? segments[i + 1] : null;
    
    // Determine if this segment + next form a sheikh-child pair
    const isPair = nextSeg && seg.speaker !== nextSeg.speaker;
    
    // Check text content for special segments
    const textIsBasmala = isBasmala(seg.text);
    const textIsIstiAdha = isIstiAdha(seg.text);
    
    if (textIsIstiAdha) {
      if (isPair) {
        timings.push({ sheikhStart: seg.start, childStart: nextSeg.start, verseNum: null, label: "الاستعاذة" });
        i += 2;
      } else {
        timings.push({ sheikhStart: seg.start, childStart: seg.start, verseNum: null, label: "الاستعاذة" });
        i++;
      }
    } else if (textIsBasmala) {
      if (basmalIsVerse) {
        verseCounter = 1;
        if (isPair) {
          timings.push({ sheikhStart: seg.start, childStart: nextSeg.start, verseNum: 1, label: "1" });
          i += 2;
        } else {
          timings.push({ sheikhStart: seg.start, childStart: seg.start, verseNum: 1, label: "1" });
          i++;
        }
      } else {
        if (isPair) {
          timings.push({ sheikhStart: seg.start, childStart: nextSeg.start, verseNum: null, label: "البسملة" });
          i += 2;
        } else {
          timings.push({ sheikhStart: seg.start, childStart: seg.start, verseNum: null, label: "البسملة" });
          i++;
        }
      }
    } else if (isPair) {
      // Normal pair: first speaker reads, second repeats
      // Only increment if we haven't exceeded the verse count
      if (verseCounter < versesCount) {
        verseCounter++;
      }
      timings.push({ sheikhStart: seg.start, childStart: nextSeg.start, verseNum: verseCounter, label: String(verseCounter) });
      i += 2;
    } else {
      // Single segment
      if (verseCounter < versesCount) {
        verseCounter++;
      }
      timings.push({ sheikhStart: seg.start, childStart: seg.start, verseNum: verseCounter, label: String(verseCounter) });
      i++;
    }
  }
  
  return timings;
}

// Track in-progress analyses to avoid duplicates
const analyzing = new Set<number>();

export async function analyzeAndCache(appSurahId: number, fileName: string, versesCount: number): Promise<AnalyzedTiming[] | null> {
  // Priority 1: Static pre-computed timings
  const staticData = getStaticTimings(appSurahId);
  if (staticData) return staticData;
  
  // Priority 2: Check localStorage cache
  const cache = loadCache();
  if (cache[appSurahId.toString()]) {
    return cache[appSurahId.toString()];
  }
  
  // Don't analyze twice simultaneously
  if (analyzing.has(appSurahId)) return null;
  analyzing.add(appSurahId);
  
  try {
    const audioUrl = `${AUDIO_BASE}/audio/${fileName}`;
    const response = await fetch(`${FUNCTIONS_URL}/analyze-audio`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({ audioUrl }),
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.segments || data.segments.length === 0) return null;
    
    const timings = processSegments(data.segments, appSurahId, versesCount);
    
    // Save to cache
    cache[appSurahId.toString()] = timings;
    saveCache(cache);
    
    return timings;
  } catch {
    return null;
  } finally {
    analyzing.delete(appSurahId);
  }
}

export function getCachedAnalysis(appSurahId: number): AnalyzedTiming[] | null {
  // Check static timings first
  const staticData = getStaticTimings(appSurahId);
  if (staticData) return staticData;
  
  const cache = loadCache();
  return cache[appSurahId.toString()] ?? null;
}

// Find active verse from analyzed timings
export function getActiveVerseFromAnalysis(timings: AnalyzedTiming[], currentTime: number): number | null {
  // Find the last timing where sheikhStart <= currentTime
  let activeIdx = 0;
  for (let i = timings.length - 1; i >= 0; i--) {
    if (currentTime >= timings[i].sheikhStart) {
      activeIdx = i;
      break;
    }
  }
  return timings[activeIdx]?.verseNum ?? null;
}
