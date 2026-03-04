import { surahs, Surah } from "../data/surahs";
import { Play, Pause, Search, Heart } from "lucide-react";
import { motion, useAnimation, PanInfo, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { useFavorites } from "../hooks/useFavorites";
import { toast } from "sonner";

interface SurahListProps {
  currentIndex: number;
  isPlaying: boolean;
  onSelect: (index: number) => void;
  searchQuery?: string;
  showOnlyFavorites?: boolean;
}

export function SurahList({
  currentIndex,
  isPlaying,
  onSelect,
  searchQuery = "",
  showOnlyFavorites = false
}: SurahListProps) {
  const { isFavorite, toggleFavorite } = useFavorites();

  const filteredSurahs = surahs.filter((surah: Surah) => {
    const matchesSearch =
      surah.name.includes(searchQuery) ||
      surah.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      surah.id.toString().includes(searchQuery);

    if (showOnlyFavorites) {
      return matchesSearch && isFavorite(surah.id);
    }
    return matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 pb-[calc(env(safe-area-inset-bottom)+180px)]">
      <AnimatePresence>
        {filteredSurahs.length > 0 ? (
          filteredSurahs.map((surah) => {
            const originalIndex = surahs.findIndex((s: Surah) => s.id === surah.id);
            const active = originalIndex === currentIndex;
            const playing = active && isPlaying;
            const favorite = isFavorite(surah.id);

            return (
              <SurahItem
                key={surah.id}
                surah={surah}
                active={active}
                playing={playing}
                favorite={favorite}
                onSelect={() => onSelect(originalIndex)}
                onToggleFavorite={() => {
                  toggleFavorite(surah.id);
                  if (!favorite) {
                    toast.success(`تمت إضافة سورة ${surah.name} إلى المفضلات`, {
                      icon: <Heart className="fill-red-500 text-red-500" size={16} />,
                    });
                  }
                }}
              />
            );
          })
        ) : showOnlyFavorites ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 relative">
              <Heart className="text-primary/20" size={40} />
              <motion.div
                animate={{ x: [0, 20, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -right-2 top-1/2 -translate-y-1/2"
              >
                <div className="bg-primary/20 p-1.5 rounded-lg">
                  <Heart className="text-primary fill-primary" size={14} />
                </div>
              </motion.div>
            </div>
            <h3 className="font-amiri text-2xl text-white mb-2">قائمة المفضلات فارغة</h3>
            <p className="text-sm text-muted-foreground/80 max-w-[250px] leading-relaxed">
              يمكنك إضافة السور المفضلة عن طريق سحب البطاقة لليمين في القائمة الرئيسية
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
              <Search className="text-muted-foreground opacity-20" size={32} />
            </div>
            <h3 className="font-amiri text-lg text-muted-foreground">لم يتم العثور على نتائج</h3>
            <p className="text-xs text-muted-foreground/60 mt-1">جرب البحث بكلمة أخرى</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SurahItem({
  surah,
  active,
  playing,
  favorite,
  onSelect,
  onToggleFavorite
}: {
  surah: Surah;
  active: boolean;
  playing: boolean;
  favorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
}) {
  const controls = useAnimation();
  const x = useMotionValue(0);

  const handleDragEnd = async (event: any, info: PanInfo) => {
    const threshold = 80;
    if (Math.abs(info.offset.x) > threshold) {
      onToggleFavorite();
      if (favorite) {
        toast.info(`تمت إزالة سورة ${surah.name} من المفضلات`, {
          icon: <Heart size={16} className="text-muted-foreground" />,
        });
      }
      x.set(0);
    } else {
      x.set(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl mb-3"
    >
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        onTap={() => {
          // Additional protection against unnecessary restarts
          if (playing) return;
          onSelect();
        }}
        className={`
          relative z-10 flex flex-row items-center gap-4 p-4 rounded-2xl border cursor-pointer
          ${active
            ? 'bg-primary/10 border-primary/30 shadow-sm'
            : 'bg-card/40 backdrop-blur-md border-white/5 hover:border-primary/20 hover:bg-secondary/40'}
        `}
      >
        {/* Left Swipe Area (Revealed when dragging right - x > 0) */}
        <div dir="ltr" className={`absolute top-0 bottom-0 left-0 -translate-x-full w-[500px] flex items-center justify-end pr-6 pointer-events-none transition-colors ${favorite ? 'bg-red-500/15' : 'bg-primary/20'}`}>
          <Heart size={26} className={favorite ? 'fill-red-500 text-red-500' : 'fill-primary text-primary'} />
        </div>

        {/* Right Swipe Area (Revealed when dragging left - x < 0) */}
        <div dir="ltr" className={`absolute top-0 bottom-0 right-0 translate-x-full w-[500px] flex items-center justify-start pl-6 pointer-events-none transition-colors ${favorite ? 'bg-red-500/15' : 'bg-primary/20'}`}>
          <Heart size={26} className={favorite ? 'fill-red-500 text-red-500' : 'fill-primary text-primary'} />
        </div>

        {/* Number circle - Rightmost in RTL */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center font-amiri text-lg shadow-inner shrink-0
          ${active ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}
        `}>
          {surah.id}
        </div>

        {/* Surah Info - Centered/Right */}
        <div className="flex-1 text-right min-w-0">
          <div className="flex items-center justify-start gap-2">
            <h3 className={`font-amiri text-xl mb-0.5 transition-colors truncate ${active ? 'text-primary font-bold' : 'text-card-foreground'}`}>
              {surah.name}
            </h3>
            {favorite && <Heart size={12} className="text-primary fill-primary shrink-0" />}
          </div>

          <div className="flex flex-col items-start gap-0.5">
            <p className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-widest leading-tight truncate text-right w-full">
              {surah.englishName}
            </p>

            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-primary/80">
                {surah.versesCount}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium">آية</span>
            </div>
          </div>
        </div>

        {/* Play Button - Leftmost in RTL */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center shrink-0
          ${active
            ? 'bg-primary text-primary-foreground shadow-md'
            : 'bg-secondary/80 text-muted-foreground'}
        `}>
          {playing ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="mr-[-2px]" fill={active ? "currentColor" : "none"} />}
        </div>

        {/* Active Indicator Bar - Right edge */}
        {active && <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-primary" />}
      </motion.div>
    </motion.div>
  );
}
