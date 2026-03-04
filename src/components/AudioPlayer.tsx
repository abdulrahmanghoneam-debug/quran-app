import { Play, Pause, SkipBack, SkipForward, Repeat, BookOpen, ChevronDown, ChevronUp, X } from "lucide-react";
import { Surah } from "../data/surahs";
import { useAudio } from "../contexts/AudioContext";
import { motion, AnimatePresence } from "framer-motion";

interface AudioPlayerProps {
  currentSurah: Surah;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isRepeat: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleRepeat: () => void;
  showVerses?: boolean;
  onToggleVerses?: () => void;
  onClose?: () => void;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({
  currentSurah,
  isPlaying,
  currentTime,
  duration,
  isRepeat,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleRepeat,
  showVerses,
  onToggleVerses,
  onClose,
}: AudioPlayerProps) {
  const { isMinimized, setIsMinimized } = useAudio();
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <AnimatePresence mode="wait">
      {showVerses ? (
        <motion.div
          key="mini-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[55] max-w-lg mx-auto"
        >
          <div className="bg-card/70 backdrop-blur-2xl border-t border-white/10 px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.25)]">
            {/* اسم السورة */}
            <p className="font-amiri text-base text-primary font-bold">سورة {currentSurah.name}</p>
            {/* شريط التقدم المصغّر */}
            <div className="flex-1 mx-4 h-1 bg-muted/40 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
            </div>
            {/* زر تشغيل/إيقاف */}
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="mr-[-2px]" />}
            </button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="full-player"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`fixed bottom-0 left-0 right-0 z-[60] transition-all duration-700 ease-in-out ${isMinimized ? 'translate-y-[calc(100%-80px)]' : 'translate-y-0'}`}
        >
          {/* Background with Premium Glass Effect */}
          <div className="bg-card/80 backdrop-blur-2xl border-t border-white/10 px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-[0_-15px_40px_rgba(0,0,0,0.3)] relative overflow-hidden">
            {/* Rest of the component remains same */}

            {/* Toggle Minimize/Expand Slider Bar */}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-primary/20 rounded-full hover:bg-primary/40 transition-colors z-20"
              aria-label={isMinimized ? "Expand" : "Minimize"}
            />

            {/* Minimized Header View */}
            <div className={`flex items-center justify-between transition-all duration-500 ${isMinimized ? 'opacity-100' : 'opacity-0 pointer-events-none h-0 invisible'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary cursor-pointer hover:bg-primary/20 transition-all" onClick={() => setIsMinimized(false)}>
                  <ChevronUp size={20} />
                </div>
                <div className="cursor-pointer" onClick={() => setIsMinimized(false)}>
                  <p className="font-amiri text-lg text-primary font-bold leading-none">سورة {currentSurah.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-1">{currentSurah.englishName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePlay();
                  }}
                  className="w-12 h-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-all"
                >
                  {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="mr-[-2px]" />}
                </button>
                {onClose && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                    }}
                    className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Full Player View */}
            <div className={`transition-all duration-700 ${isMinimized ? 'opacity-0 pointer-events-none scale-95 h-0 overflow-hidden' : 'opacity-100'}`}>
              {/* Surah title with close button */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setIsMinimized(true)}
                  className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all"
                >
                  <ChevronDown size={20} />
                </button>
                <div className="flex flex-col items-center">
                  <p className="font-amiri text-2xl text-primary font-bold">سورة {currentSurah.name}</p>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mt-1 opacity-60">{currentSurah.englishName}</p>
                </div>
                {onClose ? (
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all"
                  >
                    <X size={20} />
                  </button>
                ) : <div className="w-10" />}
              </div>

              {/* Premium Seek Bar */}
              <div className="flex items-center gap-4 mb-5" dir="ltr">
                <span className="text-[10px] text-muted-foreground w-8 text-right font-medium tabular-nums">{formatTime(currentTime)}</span>
                <div className="flex-1 relative h-6 flex items-center group">
                  <div className="w-full h-1.5 bg-muted/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-150 relative"
                      style={{ width: `${progress}%` }}
                    >
                      <div className="absolute top-0 bottom-0 right-0 w-2 bg-white/20 blur-sm" />
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) => onSeek(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div
                    className="absolute w-4 h-4 bg-primary rounded-full border-2 border-white shadow-xl transition-transform scale-0 group-hover:scale-110 pointer-events-none z-20"
                    style={{ left: `calc(${progress}% - 8px)` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-8 font-medium tabular-nums">{formatTime(duration)}</span>
              </div>

              {/* Controls Grid */}
              <div className="flex items-center justify-between max-w-sm mx-auto">
                <div className="flex items-center gap-3">
                  <button
                    onClick={onToggleRepeat}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isRepeat ? "bg-primary/15 text-primary shadow-inner" : "text-muted-foreground hover:bg-muted/50"}`}
                  >
                    <Repeat size={20} className={isRepeat ? 'animate-pulse' : ''} />
                  </button>

                  {onToggleVerses && (
                    <button
                      onClick={onToggleVerses}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${showVerses ? "bg-primary/15 text-primary shadow-inner" : "text-muted-foreground hover:bg-muted/50"}`}
                    >
                      <BookOpen size={20} />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <button onClick={onPrev} className="w-12 h-12 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-90">
                    <SkipBack size={26} fill="currentColor" fillOpacity={0.1} />
                  </button>

                  <button
                    onClick={onTogglePlay}
                    className="w-16 h-16 rounded-3xl bg-primary text-primary-foreground flex items-center justify-center shadow-[0_12px_30px_rgba(var(--primary-rgb),0.3)] hover:scale-105 active:scale-95 transition-all relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} className="mr-[-2px]" fill="currentColor" />}
                  </button>

                  <button onClick={onNext} className="w-12 h-12 rounded-2xl flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all active:scale-90">
                    <SkipForward size={26} fill="currentColor" fillOpacity={0.1} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
