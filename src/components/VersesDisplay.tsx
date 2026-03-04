import { useEffect, useRef, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "../contexts/AudioContext";
import { fetchSurahVerses } from "../data/verses";
import { getStaticTimings, type AnalyzedTiming } from "../data/staticTimings";
import { BookOpen, X, Loader2, CheckCircle2 } from "lucide-react";

interface VersesDisplayProps {
  surahId: number;
  surahName: string;
  currentTime: number;
  duration: number;
  isVisible: boolean;
  onClose: () => void;
  onSeek?: (time: number) => void;
}

export function VersesDisplay({
  surahId,
  surahName,
  currentTime,
  duration,
  isVisible,
  onClose,
  onSeek,
}: VersesDisplayProps) {
  const player = useAudio();
  const [verses, setVerses] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [synced, setSynced] = useState(false);
  const activeRef = useRef<HTMLDivElement>(null);

  // Fetch verses when surah changes or becomes visible
  useEffect(() => {
    if (!isVisible) return;

    setLoading(true);
    setSynced(false);
    fetchSurahVerses(surahId).then((v: string[]) => {
      setVerses(v);
      setLoading(false);
      const timings = getStaticTimings(surahId);
      if (timings && v.length > 0) {
        setSynced(true);
      }
    });
  }, [surahId, isVisible]);

  // Use staticTimings as the PRIMARY and ONLY source
  const staticTimings = useMemo(() => getStaticTimings(surahId), [surahId]);

  // Calculate active verse number from static timings
  const activeVerseNumbers = useMemo(() => {
    if (!staticTimings || staticTimings.length === 0 || verses.length === 0) {
      // Fallback: approximate based on duration
      if (!duration || duration === 0 || verses.length === 0) return new Set([1]);
      const timePerVerse = duration / verses.length;
      const index = Math.min(Math.floor(currentTime / timePerVerse), verses.length - 1);
      return new Set([index + 1]);
    }

    // Find the timing entry where currentTime falls
    // Transition happens at sheikhStart of each entry - when the sheikh
    // starts reading the next verse (which is right after the child finishes)
    let activeTimingIdx = 0;
    for (let i = staticTimings.length - 1; i >= 0; i--) {
      if (currentTime >= staticTimings[i].sheikhStart) {
        activeTimingIdx = i;
        break;
      }
    }

    const activeTiming = staticTimings[activeTimingIdx];

    // Skip non-verse entries (basmala, isti'adha)
    if (activeTiming.verseNum === null) {
      return new Set<number>();
    }

    return new Set([activeTiming.verseNum]);
  }, [currentTime, duration, verses.length, staticTimings]);

  // Auto-scroll to first active verse
  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [activeVerseNumbers]);

  return (
    <motion.div
      initial={{ y: "100%", opacity: 0 }}
      animate={{
        y: isVisible ? 0 : "100%",
        opacity: isVisible ? 1 : 0
      }}
      exit={{ y: "100%", opacity: 0 }}
      transition={{
        type: "spring",
        damping: 30,
        stiffness: 300,
        mass: 0.8
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex flex-col max-w-lg mx-auto overflow-hidden shadow-[0_-20px_50px_rgba(0,0,0,0.5)]"
    >
      {/* Header with Safe Area support */}
      <div className="sticky top-0 z-10 bg-card/60 backdrop-blur-xl border-b border-border/50 px-4 pt-[calc(env(safe-area-inset-top)+1rem)] pb-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-2xl bg-secondary/80 flex items-center justify-center text-foreground hover:bg-primary/10 hover:text-primary transition-all duration-300 active:scale-90"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3">
            {/* Sync indicator */}
            <div className="flex flex-col items-end">
              <h2 className="font-amiri text-xl text-primary font-bold">سورة {surahName}</h2>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">صفحة الآيات</span>
                {loading ? (
                  <Loader2 size={12} className="animate-spin text-primary" />
                ) : synced ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                ) : null}
              </div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <BookOpen size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Verses */}
      <div className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom)+180px)] px-6 py-6 scroll-smooth">
        {loading ? (
          <div className="flex items-center justify-center py-20 flex-col gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">جاري تحميل الآيات والمزامنة...</p>
          </div>
        ) : verses.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p>لا يمكن تحميل الآيات</p>
            <p className="text-sm mt-1">تحقق من اتصال الإنترنت</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verses.map((verse, index) => {
              const verseNum = index + 1;
              const isActive = activeVerseNumbers.has(verseNum);
              return (
                <div
                  key={index}
                  ref={isActive ? activeRef : null}
                  onClick={() => {
                    if (onSeek && staticTimings) {
                      const timing = staticTimings.find((t: AnalyzedTiming) => t.verseNum === verseNum);
                      if (timing) {
                        onSeek(timing.sheikhStart);
                        // Force play if it was paused
                        const { isPlaying, togglePlay } = player;
                        if (!isPlaying) togglePlay();
                      }
                    }
                  }}
                  className={`relative rounded-xl px-4 py-3 transition-all duration-500 cursor-pointer active:scale-[0.98] ${isActive
                    ? "bg-primary/10 border border-primary/30 shadow-lg shadow-primary/5"
                    : "border border-transparent hover:bg-muted/30"
                    }`}
                >
                  <div className="flex items-start gap-3" dir="rtl">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shrink-0 mt-1 ${isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {verseNum}
                    </span>
                    <p
                      className={`font-quran text-right text-2xl flex-1 transition-colors duration-500 ${isActive ? "text-foreground" : "text-muted-foreground"
                        }`}
                    >
                      {verse}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
