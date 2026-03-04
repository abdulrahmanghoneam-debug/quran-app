import { useEffect } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { App } from "@capacitor/app";
import { useLocation, useNavigate } from "react-router-dom";

export function AppBackButton() {
    const { showVerses, setShowVerses } = useAudio();
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const setupListener = async () => {
            const handler = await App.addListener("backButton", (data) => {
                if (showVerses) {
                    setShowVerses(false);
                } else if (location.pathname !== "/") {
                    navigate("/");
                } else {
                    // We are on home screen and no verses shown, exit app
                    App.exitApp();
                }
            });
            return handler;
        };

        const handlerPromise = setupListener();

        return () => {
            handlerPromise.then(h => h.remove());
        };
    }, [showVerses, location.pathname, navigate, setShowVerses]);

    return null;
}
