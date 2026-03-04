import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

// Register service worker for offline support
registerSW({
  onRegisteredSW(swUrl, registration) {
    console.log("SW registered:", swUrl);
  },
  onOfflineReady() {
    console.log("App ready for offline use");
  },
});

createRoot(document.getElementById("root")!).render(<App />);
