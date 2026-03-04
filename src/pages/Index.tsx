import { useAudio } from "../contexts/AudioContext";
import { SurahList } from "../components/SurahList";
import { BookOpen, ArrowRight, Search, X, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";

const Index = () => {
  const player = useAudio();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const { scrollY } = useScroll();
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // If search is active, DO NOT hide the header, otherwise the input vanishes!
    if (isSearchVisible) {
      if (!isHeaderVisible) setIsHeaderVisible(true);
      lastScrollY.current = latest;
      return;
    }

    // Radical sensitivity: Show on ANY upward movement, hide on ANY downward movement
    if (latest < 10) {
      setIsHeaderVisible(true);
    } else if (latest > lastScrollY.current) {
      if (isHeaderVisible) setIsHeaderVisible(false);
    } else if (latest < lastScrollY.current) {
      if (!isHeaderVisible) setIsHeaderVisible(true);
    }
    lastScrollY.current = latest;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-premium-green islamic-pattern flex flex-col max-w-lg mx-auto relative overflow-hidden"
    >
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[30%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[30%] bg-primary/5 blur-[120px] rounded-full" />

      {/* Smart Fixed Header */}
      <motion.header
        initial={false}
        animate={{
          y: isHeaderVisible ? 0 : -100,
          opacity: isHeaderVisible ? 1 : 0
        }}
        transition={{ duration: 0.25, ease: [0.21, 1.02, 0.47, 0.98] }}
        className="fixed top-0 left-0 right-0 z-[45] bg-black/60 backdrop-blur-2xl border-b border-white/10 shadow-lg pt-[env(safe-area-inset-top)] max-w-lg mx-auto"
        style={{ minHeight: '70px' }}
      >
        <div className="px-4 py-4 text-center relative flex items-center justify-between min-h-[70px] gap-2">
          {/* Back Button */}
          {!isSearchVisible && (
            <button
              onClick={() => {
                if (player.showVerses) {
                  player.setShowVerses(false);
                } else if (showOnlyFavorites) {
                  setShowOnlyFavorites(false);
                } else {
                  navigate("/");
                }
              }}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-primary/20 hover:text-white transition-all duration-300 active:scale-90 shrink-0"
            >
              <ArrowRight size={20} />
            </button>
          )}

          {/* Title or Search Input */}
          <div className="flex-1 flex items-center justify-center min-w-0">
            {isSearchVisible ? (
              <div className="w-full relative animate-in fade-in slide-in-from-top-2 duration-300">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input
                  type="text"
                  placeholder="ابحث عن سورة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full h-11 pr-10 pl-10 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 text-sm focus:ring-2 focus:ring-primary/40 transition-all font-amiri outline-none backdrop-blur-md"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/10 shrink-0">
                  <BookOpen size={18} />
                </div>
                <h1 className="font-amiri text-2xl text-white font-bold tracking-wide truncate">
                  {player.showVerses ? `سورة ${player.currentSurah.name}` : showOnlyFavorites ? "المفضلات" : "جزء المعلم للطفل"}
                </h1>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {!player.showVerses && (
              <>
                <button
                  onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 ${showOnlyFavorites ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-white/5 border-white/10 text-white/70 hover:bg-primary/10 hover:text-primary'}`}
                >
                  <Heart size={20} className={showOnlyFavorites ? "fill-primary-foreground" : ""} />
                </button>

                <button
                  onClick={() => {
                    setIsSearchVisible(!isSearchVisible);
                    if (isSearchVisible) setSearchQuery("");
                  }}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-300 ${isSearchVisible ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30' : 'bg-white/5 border-white/10 text-white/70 hover:bg-primary/10 hover:text-primary'}`}
                >
                  <Search size={20} />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Spacer to push content below the fixed header */}
      <div className="h-[95px] pt-[env(safe-area-inset-top)] shrink-0" />

      {/* Surah List Area */}
      <main className="flex-1 overflow-visible relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={showOnlyFavorites ? "favorites" : "all"}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <SurahList
              currentIndex={player.currentIndex}
              isPlaying={player.isPlaying}
              onSelect={player.playSurah}
              searchQuery={searchQuery}
              showOnlyFavorites={showOnlyFavorites}
            />
          </motion.div>
        </AnimatePresence>
      </main>
    </motion.div>
  );
};

export default Index;
