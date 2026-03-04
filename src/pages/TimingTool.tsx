import { useState, useRef, useCallback, useEffect } from "react";
import { surahs } from "@/data/surahs";
import { fetchSurahVerses } from "@/data/verses";
import { getStaticTimings } from "@/data/staticTimings";
import { Play, Pause, Copy, Check, SkipBack, Gauge } from "lucide-react";

interface TimingEntry {
  sheikhStart: number;
  childStart: number;
  verseNum: number | null;
  label: string;
}

const SPEED_OPTIONS = [1, 1.25, 1.5, 1.75, 2];

export default function TimingTool() {
  const [selectedSurahId, setSelectedSurahId] = useState<number | null>(null);
  const [verses, setVerses] = useState<string[]>([]);
  const [timings, setTimings] = useState<TimingEntry[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [copied, setCopied] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [nextVerseToRecord, setNextVerseToRecord] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const surah = surahs.find(s => s.id === selectedSurahId);

  // Load verses + existing timings
  useEffect(() => {
    if (!selectedSurahId) return;
    fetchSurahVerses(selectedSurahId).then(setVerses);
    const existing = getStaticTimings(selectedSurahId);
    if (existing) {
      setTimings([...existing]);
    } else {
      setTimings([]);
    }
    setNextVerseToRecord(null);
  }, [selectedSurahId]);

  // Audio time update
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
    };
  }, [selectedSurahId]);

  // Auto-scroll to active verse
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [nextVerseToRecord]);

  // Enter key = record current verse and advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && nextVerseToRecord !== null && audioRef.current) {
        e.preventDefault();
        recordVerse(nextVerseToRecord);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextVerseToRecord, verses.length]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const seekBack = () => {
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 3);
  };

  const cycleSpeed = () => {
    const idx = SPEED_OPTIONS.indexOf(speed);
    const next = SPEED_OPTIONS[(idx + 1) % SPEED_OPTIONS.length];
    setSpeed(next);
    if (audioRef.current) audioRef.current.playbackRate = next;
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${m}:${String(s).padStart(2, "0")}.${ms}`;
  };

  // Record timing for a verse (single click = set sheikhStart, auto-advance)
  const recordVerse = useCallback((verseNum: number) => {
    if (!audioRef.current) return;
    const time = Math.round(audioRef.current.currentTime * 1000) / 1000;

    setTimings(prev => {
      const idx = prev.findIndex(t => t.verseNum === verseNum && t.label === String(verseNum));
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], sheikhStart: time, childStart: time };
        return updated;
      }
      const newEntry: TimingEntry = { sheikhStart: time, childStart: time, verseNum, label: String(verseNum) };
      const newTimings = [...prev, newEntry];
      newTimings.sort((a, b) => a.sheikhStart - b.sheikhStart);
      return newTimings;
    });

    // Auto-advance to next verse
    if (verseNum < verses.length) {
      setNextVerseToRecord(verseNum + 1);
    } else {
      setNextVerseToRecord(null);
    }
  }, [verses.length]);

  // Handle clicking a verse
  const handleVerseClick = (verseNum: number) => {
    recordVerse(verseNum);
  };

  // Handle special entries (isti'adha, basmala)
  const handleSpecialClick = (label: string) => {
    if (!audioRef.current) return;
    const time = Math.round(audioRef.current.currentTime * 1000) / 1000;
    setTimings(prev => {
      const idx = prev.findIndex(t => t.label === label);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], sheikhStart: time, childStart: time };
        return updated;
      }
      const newEntry: TimingEntry = { sheikhStart: time, childStart: time, verseNum: null, label };
      return [newEntry, ...prev];
    });
  };

  const exportTimings = () => {
    if (!selectedSurahId || timings.length === 0) return;
    const lines = timings.map(t => {
      const vs = t.verseNum !== null ? t.verseNum : "null";
      return `    { sheikhStart: ${t.sheikhStart}, childStart: ${t.childStart}, verseNum: ${vs}, label: "${t.label}" }`;
    });
    const code = `  ${selectedSurahId}: [ // ${surah?.name}\n${lines.join(",\n")}\n  ],`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTimingForVerse = (verseNum: number) => timings.find(t => t.verseNum === verseNum);
  const getTimingForLabel = (label: string) => timings.find(t => t.label === label);

  // Determine which verse is currently playing
  const currentPlayingVerse = (() => {
    if (timings.length === 0) return null;
    let active: TimingEntry | null = null;
    for (const t of timings) {
      if (currentTime >= t.sheikhStart) active = t;
    }
    return active?.verseNum;
  })();

  return (
    <div className="min-h-screen bg-background text-foreground max-w-lg mx-auto flex flex-col" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b border-border px-4 py-3">
        <h1 className="text-lg font-bold text-primary mb-2">أداة التوقيت</h1>
        <select
          value={selectedSurahId ?? ""}
          onChange={e => { setSelectedSurahId(Number(e.target.value)); setIsPlaying(false); }}
          className="w-full p-2 rounded-lg bg-secondary text-foreground border border-border text-sm"
        >
          <option value="">اختر سورة...</option>
          {surahs.map(s => {
            const hasTimings = !!getStaticTimings(s.id);
            return (
              <option key={s.id} value={s.id}>
                {hasTimings ? "✅" : "⬜"} {s.id}. {s.name} ({s.versesCount} آيات)
              </option>
            );
          })}
        </select>
      </div>

      {selectedSurahId && surah && (
        <>
          <audio ref={audioRef} src={`/audio/${surah.fileName}`} onEnded={() => setIsPlaying(false)} />

          {/* Controls */}
          <div className="sticky top-[88px] z-10 bg-card/95 backdrop-blur border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <button onClick={seekBack} className="p-2 rounded-lg bg-secondary text-foreground"><SkipBack size={18} /></button>
              <button onClick={togglePlay} className="p-2 rounded-lg bg-primary text-primary-foreground">
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button onClick={cycleSpeed} className="px-2 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-bold min-w-[44px]">
                {speed}x
              </button>
              <span className="text-sm font-mono text-muted-foreground flex-1 text-center">{formatTime(currentTime)}</span>
              <button onClick={exportTimings} className="p-2 rounded-lg bg-accent text-accent-foreground" title="نسخ الكود">
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>

            {/* Seek bar */}
            <div className="relative h-6 flex items-center" dir="ltr">
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-150" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
              </div>
              <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
                onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>

            {/* Next verse hint */}
            {nextVerseToRecord !== null && (
              <div className="text-center text-sm font-bold py-1.5 mt-2 rounded-lg bg-blue-500/20 text-blue-400">
                ⏳ اضغط على الآية {nextVerseToRecord} أو Enter عند بداية الشيخ
              </div>
            )}
          </div>

          {/* Verses list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 pb-40">
            {/* Special entries */}
            <div className="flex gap-2 mb-3">
              {(() => {
                const istiTiming = getTimingForLabel("الاستعاذة");
                return (
                  <button
                    onClick={() => handleSpecialClick("الاستعاذة")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      istiTiming ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    الاستعاذة {istiTiming ? `(${formatTime(istiTiming.sheikhStart)})` : ""}
                  </button>
                );
              })()}
              {selectedSurahId !== 1 && (() => {
                const basmalaTiming = getTimingForLabel("البسملة");
                return (
                  <button
                    onClick={() => handleSpecialClick("البسملة")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      basmalaTiming ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    البسملة {basmalaTiming ? `(${formatTime(basmalaTiming.sheikhStart)})` : ""}
                  </button>
                );
              })()}
            </div>

            {/* Verse buttons */}
            {verses.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-8">جاري تحميل الآيات...</p>
            ) : (
              <div className="space-y-1.5">
                {verses.map((verse, index) => {
                  const verseNum = index + 1;
                  const timing = getTimingForVerse(verseNum);
                  const isNext = nextVerseToRecord === verseNum;
                  const isCurrentlyPlaying = currentPlayingVerse === verseNum;

                  return (
                    <div
                      key={verseNum}
                      ref={isNext ? activeRef : null}
                      onClick={() => handleVerseClick(verseNum)}
                      className={`relative rounded-xl px-3 py-2.5 transition-all cursor-pointer active:scale-[0.98] ${
                        isNext
                          ? "bg-blue-500/15 border-2 border-blue-500/50 shadow-lg"
                          : isCurrentlyPlaying
                            ? "bg-primary/10 border border-primary/30"
                            : timing
                              ? "bg-card border border-border"
                              : "bg-secondary/30 border border-transparent"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 mt-0.5 ${
                          timing ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"
                        }`}>
                          {verseNum}
                        </span>
                        <p className="font-amiri text-base leading-relaxed flex-1 text-foreground line-clamp-2">
                          {verse}
                        </p>
                        {timing && (
                          <span className="shrink-0 text-[10px] font-mono text-blue-400">
                            {formatTime(timing.sheikhStart)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Export info */}
            {timings.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-xs text-muted-foreground mb-2">
                  {timings.filter(t => t.verseNum !== null).length} / {verses.length} آية مسجلة
                </p>
                <button
                  onClick={exportTimings}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold"
                >
                  {copied ? "✅ تم النسخ!" : "📋 نسخ الكود"}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
