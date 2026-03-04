import { useEffect } from "react";
import { prefetchAllVerses } from "./data/verses";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Home from "./pages/Home";
import Index from "./pages/Index";
import DownloadPage from "./pages/Download";
import TimingTool from "./pages/TimingTool";
import NotFound from "./pages/NotFound";
import { AudioProvider, useAudio } from "./contexts/AudioContext";
import { AppBackButton } from "./components/AppBackButton";
import { AudioPlayer } from "./components/AudioPlayer";
import { VersesDisplay } from "./components/VersesDisplay";

const queryClient = new QueryClient();

const GlobalAudioComponents = () => {
  const { currentSurah, isPlaying, currentTime, duration, isRepeat, togglePlay, playNext, playPrev, seek, toggleRepeat, showVerses, setShowVerses, isPlayerActive, closePlayer, isMinimized, setIsMinimized } = useAudio();
  const location = useLocation();

  // تحميل جميع السور مسبقاً في الخلفية عند وجود إنترنت
  useEffect(() => {
    prefetchAllVerses();
  }, []);

  useEffect(() => {
    if (location.pathname === "/") {
      setIsMinimized(true);
    } else if (location.pathname === "/juz-almuallim") {
      setIsMinimized(false);
    }
  }, [location.pathname, setIsMinimized]);

  if (!currentSurah || !isPlayerActive) return null;

  return (
    <>
      <AnimatePresence>
        {showVerses && (
          <VersesDisplay
            surahId={currentSurah.id}
            surahName={currentSurah.name}
            currentTime={currentTime}
            duration={duration}
            isVisible={showVerses}
            onClose={() => setShowVerses(false)}
            onSeek={seek}
          />
        )}
      </AnimatePresence>
      <AudioPlayer
        currentSurah={currentSurah}
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        isRepeat={isRepeat}
        onTogglePlay={togglePlay}
        onNext={playNext}
        onPrev={playPrev}
        onSeek={seek}
        onToggleRepeat={toggleRepeat}
        showVerses={showVerses}
        onToggleVerses={() => setShowVerses(!showVerses)}
        onClose={closePlayer}
      />
    </>
  );
};

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/juz-almuallim" element={<Index />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/timing-tool" element={<TimingTool />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AudioProvider>
        <Sonner position="bottom-center" richColors expand={false} />
        <BrowserRouter>
          <AppBackButton />
          <GlobalAudioComponents />
          <AnimatedRoutes />
        </BrowserRouter>
      </AudioProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
