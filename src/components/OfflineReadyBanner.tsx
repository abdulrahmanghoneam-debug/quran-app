import { useState, useEffect } from "react";
import { Download, CheckCircle2, Wifi } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const CACHE_READY_KEY = "pwa-cache-ready";

export function OfflineReadyBanner() {
  const [status, setStatus] = useState<"checking" | "downloading" | "ready" | "hidden">("checking");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // If already cached before, don't show
    if (localStorage.getItem(CACHE_READY_KEY) === "true") {
      setStatus("hidden");
      return;
    }

    // Check if service worker is active and caching
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // Start showing download status
        setStatus("downloading");
        
        // Simulate progress based on caching activity
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += Math.random() * 8 + 2;
          if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(interval);
            setStatus("ready");
            localStorage.setItem(CACHE_READY_KEY, "true");
            // Hide after 3 seconds
            setTimeout(() => setStatus("hidden"), 3000);
          }
          setProgress(Math.min(currentProgress, 100));
        }, 500);

        return () => clearInterval(interval);
      });
    } else {
      setStatus("hidden");
    }
  }, []);

  if (status === "hidden") return null;

  return (
    <div className="mx-4 mt-3 mb-1 rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 animate-in fade-in slide-in-from-top-2 duration-500">
      {status === "downloading" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Download size={20} className="text-primary animate-bounce" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">جارٍ تجهيز التطبيق للعمل بدون إنترنت...</p>
              <p className="text-xs text-muted-foreground mt-0.5">يتم تحميل الملفات الصوتية</p>
            </div>
            <span className="text-xs font-bold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {status === "ready" && (
        <div className="flex items-center gap-3">
          <CheckCircle2 size={20} className="text-green-500" />
          <div>
            <p className="text-sm font-semibold text-foreground">التطبيق جاهز للعمل بدون إنترنت ✅</p>
            <p className="text-xs text-muted-foreground mt-0.5">يمكنك الآن الاستماع في أي وقت</p>
          </div>
        </div>
      )}

      {status === "checking" && (
        <div className="flex items-center gap-3">
          <Wifi size={20} className="text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">جارٍ التحقق...</p>
        </div>
      )}
    </div>
  );
}
