import { useNavigate } from "react-router-dom";
import { Moon, BookMarked, ChevronLeft, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import appLogo from "../assets/app-logo.jpeg";

const Home = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "جزء المعلم للطفل",
      description: "جزء عمّ بصوت الشيخ محمد شريف",
      icon: BookOpen,
      available: true,
      onClick: () => navigate("/juz-almuallim"),
    },
    {
      title: "القرآن الكريم",
      description: "قريباً إن شاء الله",
      icon: BookMarked,
      available: false,
    },
    {
      title: "الأذكار",
      description: "قريباً إن شاء الله",
      icon: Moon,
      available: false,
    },
  ];

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="min-h-screen bg-premium-green islamic-pattern flex flex-col max-w-lg mx-auto relative overflow-hidden"
    >
      {/* Background Decorative Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[40%] bg-primary/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[40%] bg-primary/5 blur-[150px] rounded-full" />

      {/* Header with Glassmorphic Logo Container */}
      <header className="pt-[calc(env(safe-area-inset-top)+3rem)] pb-10 px-6 text-center relative z-10">
        <div className="relative inline-block group">
          <div className="absolute -inset-6 bg-primary/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="premium-glass p-2 rounded-[2.5rem] relative z-10 shadow-2xl overflow-hidden">
            <div className="gloss-shine" />
            <img
              src={appLogo}
              alt="القرآن الكريم - الشيخ محمد شريف"
              className="w-40 h-40 mx-auto rounded-[2rem] object-cover relative z-10"
            />
          </div>
        </div>
      </header>

      {/* Sections - Premium Glass Buttons */}
      <main className="flex-1 flex flex-col justify-center px-6 pb-16 space-y-6 relative z-10 -mt-4">
        {sections.map((section) => (
          <button
            key={section.title}
            onClick={section.available ? section.onClick : undefined}
            disabled={!section.available}
            className={`
              w-full rounded-[2rem] p-5 text-right flex items-center gap-5 transition-all duration-500 group relative overflow-hidden 
              ${section.available
                ? "premium-glass-gold gloss-effect active:scale-[0.98] cursor-pointer"
                : "premium-glass opacity-50 cursor-not-allowed grayscale"
              }
            `}
          >
            {/* Gloss Shine Overlay */}
            <div className="gloss-shine" />

            {/* Hover Glow Effect */}
            <div className="absolute inset-0 bg-gradient-to-l from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Icon Container */}
            <div
              className={`
                w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500 
                ${section.available
                  ? "bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-white/10 text-white/40"
                }
              `}
            >
              <section.icon size={32} strokeWidth={1.5} />
            </div>

            {/* Content Area */}
            <div className="flex-1 relative z-10 pr-1">
              <h3 className={`font-amiri text-2xl mb-1.5 transition-colors font-bold ${section.available ? 'text-white group-hover:text-primary-foreground' : 'text-white/40'}`}>
                {section.title}
              </h3>
              <p className={`text-sm leading-relaxed font-medium transition-colors ${section.available ? 'text-white/70 group-hover:text-white' : 'text-white/20'}`}>
                {section.description}
              </p>
            </div>

            {/* Availability Indicator */}
            {section.available ? (
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-primary/30 transition-all">
                <ChevronLeft size={22} />
              </div>
            ) : (
              <div className="premium-glass px-4 py-1.5 rounded-full border border-white/10">
                <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest font-amiri">قريباً</span>
              </div>
            )}
          </button>
        ))}
      </main>

      {/* Footer */}
      <footer className="pb-[calc(env(safe-area-inset-bottom)+2rem)] text-center relative z-10 space-y-2">
        <p className="text-xs text-white/50 font-amiri tracking-[0.5em] uppercase opacity-40">بسم الله الرحمن الرحيم</p>
        <p className="text-[10px] text-primary/60 font-amiri">تم التطوير بواسطة عبدالرحمن غنيم</p>
      </footer>
    </motion.div>
  );
};

export default Home;
