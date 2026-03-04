import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useAudioPlayer as useAudioPlayerHook } from "../hooks/useAudioPlayer";

type AudioPlayerType = ReturnType<typeof useAudioPlayerHook>;

interface AudioContextType extends AudioPlayerType {
    isPlayerActive: boolean;
    setIsPlayerActive: (active: boolean) => void;
    isMinimized: boolean;
    setIsMinimized: (minimized: boolean) => void;
    closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
    const player = useAudioPlayerHook();
    const [isPlayerActive, setIsPlayerActive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    // If a surah starts playing, make sure the player is active
    useEffect(() => {
        if (player.isPlaying) {
            setIsPlayerActive(true);
        }
    }, [player.isPlaying]);

    const closePlayer = () => {
        if (player.isPlaying) {
            player.togglePlay();
        }
        setIsPlayerActive(false);
        player.setShowVerses(false);
    };

    const value: AudioContextType = {
        ...player,
        isPlayerActive,
        setIsPlayerActive,
        isMinimized,
        setIsMinimized,
        closePlayer,
    };

    return (
        <AudioContext.Provider value={value}>
            {children}
        </AudioContext.Provider>
    );
}

export function useAudio() {
    const context = useContext(AudioContext);
    if (!context) throw new Error("useAudio must be used within AudioProvider");
    return context;
}
