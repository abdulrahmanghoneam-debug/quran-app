import { useState, useRef, useEffect, useCallback } from "react";
import { surahs } from "../data/surahs";

const STORAGE_KEY = "quran-player-state";

interface SavedState {
  surahIndex: number;
  currentTime: number;
}

function loadState(): SavedState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { }
  return { surahIndex: 0, currentTime: 0 };
}

function saveState(state: SavedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useAudioPlayer() {
  const savedState = useRef(loadState());
  const [currentIndex, setCurrentIndex] = useState(savedState.current.surahIndex);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const [showVerses, setShowVerses] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio object once and set up basic listeners
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      saveState({ surahIndex: currentIndex, currentTime: audio.currentTime });
    };
    const onLoadedMetadata = () => setDuration(audio.duration);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  const updateMediaSession = useCallback((index: number) => {
    if ('mediaSession' in navigator) {
      const surah = surahs[index];
      navigator.mediaSession.metadata = new MediaMetadata({
        title: surah.name,
        artist: "الشيخ محمد شريف",
        album: "المصحف المعلم - جزء عم",
        artwork: [
          { src: '/app-logo.jpeg', sizes: '512x512', type: 'image/jpeg' }
        ]
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  // Sync position state with Media Session
  useEffect(() => {
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession && duration > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: duration,
          playbackRate: audioRef.current?.playbackRate || 1,
          position: currentTime,
        });
      } catch (e) {
        console.error("Error setting Media Session position state:", e);
      }
    }
  }, [currentTime, duration]);

  const playSurah = useCallback((index: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    // RADICAL FIX: Don't reset if already playing the same surah
    if (index === currentIndex && !audio.paused && audio.src.includes(surahs[index].fileName)) {
      return;
    }

    const surah = surahs[index];
    audio.src = `/audio/${surah.fileName}`;
    audio.currentTime = 0;
    setCurrentIndex(index);
    setCurrentTime(0);
    setIsPlaying(true);
    audio.play()
      .then(() => {
        if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
      })
      .catch(() => { });
    saveState({ surahIndex: index, currentTime: 0 });
    updateMediaSession(index);
  }, [currentIndex, updateMediaSession]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src || audio.src === window.location.href) {
      const surah = surahs[currentIndex];
      audio.src = `/audio/${surah.fileName}`;
      if (savedState.current.surahIndex === currentIndex && savedState.current.currentTime > 0) {
        audio.currentTime = savedState.current.currentTime;
      }
      updateMediaSession(currentIndex);
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    } else {
      audio.play()
        .then(() => {
          if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
        })
        .catch(() => { });
      setIsPlaying(true);
      updateMediaSession(currentIndex);
    }
  }, [isPlaying, currentIndex, updateMediaSession]);

  const playNext = useCallback(() => {
    if (currentIndex < surahs.length - 1) playSurah(currentIndex + 1);
  }, [currentIndex, playSurah]);

  const playPrev = useCallback(() => {
    if (currentIndex > 0) playSurah(currentIndex - 1);
  }, [currentIndex, playSurah]);

  // Update Media Session handlers whenever callbacks change
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => togglePlay());
      navigator.mediaSession.setActionHandler('pause', () => togglePlay());
      navigator.mediaSession.setActionHandler('previoustrack', () => playPrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => playNext());

      return () => {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      };
    }
  }, [togglePlay, playNext, playPrev]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.readyState >= 1) {
        audio.currentTime = time;
        setCurrentTime(time);
      } else {
        setCurrentTime(time);
        const onCanSeek = () => {
          try { audio.currentTime = time; } catch { }
          audio.removeEventListener("loadeddata", onCanSeek);
        };
        audio.addEventListener("loadeddata", onCanSeek);
      }
    } catch { }
  }, []);

  const toggleRepeat = useCallback(() => setIsRepeat((r) => !r), []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onEnded = () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(() => { });
      } else if (currentIndex < surahs.length - 1) {
        playSurah(currentIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
  }, [isRepeat, currentIndex, playSurah]);

  return {
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    isRepeat,
    showVerses,
    setShowVerses,
    playSurah,
    togglePlay,
    playNext,
    playPrev,
    seek,
    toggleRepeat,
    currentSurah: surahs[currentIndex],
  };
}
