import { useState, useEffect } from "react";
import { Download, Smartphone, Wifi, WifiOff, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import appLogo from "@/assets/app-logo.jpeg";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DownloadPage = () => {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setIsIOS(ios);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const features = [
    { icon: Smartphone, text: "يعمل كتطبيق حقيقي على هاتفك" },
    { icon: WifiOff, text: "يعمل بدون إنترنت بعد التحميل" },
    { icon: Wifi, text: "تحديثات تلقائية عند الاتصال" },
  ];

  return (
    <div className="min-h-screen bg-background islamic-pattern flex flex-col items-center justify-center max-w-lg mx-auto relative px-6 py-12">
      {/* Logo */}
      <div className="relative z-10 text-center mb-8">
        <img
          src={appLogo}
          alt="جزء عم"
          className="w-28 h-28 mx-auto rounded-2xl object-contain shadow-lg mb-5"
        />
        <h1 className="font-amiri text-3xl text-primary mb-2">جزء عم</h1>
        <p className="text-muted-foreground text-sm">بصوت الشيخ محمد شريف</p>
      </div>

      <div className="gold-divider w-full mb-8 relative z-10" />

      {/* Features */}
      <div className="w-full space-y-3 mb-8 relative z-10">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-3 bg-card/60 border border-border rounded-xl px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <f.icon size={18} className="text-primary" />
            </div>
            <p className="text-foreground text-sm">{f.text}</p>
          </div>
        ))}
      </div>

      {/* Install Button */}
      <div className="w-full relative z-10 space-y-3">
        {installed ? (
          <>
            <div className="w-full rounded-xl bg-primary/15 border border-primary/30 p-5 text-center">
              <CheckCircle2 size={32} className="text-primary mx-auto mb-2" />
              <p className="font-amiri text-lg text-primary">تم تثبيت التطبيق ✅</p>
              <p className="text-sm text-muted-foreground mt-1">يمكنك فتحه من شاشة هاتفك الرئيسية</p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="w-full rounded-xl bg-card border border-border p-4 text-center flex items-center justify-center gap-2 text-foreground hover:bg-secondary transition-colors"
            >
              <span>فتح التطبيق</span>
              <ArrowRight size={18} />
            </button>
          </>
        ) : isIOS ? (
          <div className="w-full rounded-xl bg-card border border-border p-5 text-center">
            <Smartphone size={32} className="text-primary mx-auto mb-3" />
            <p className="font-amiri text-lg text-foreground mb-2">للتثبيت على iPhone</p>
            <div className="text-sm text-muted-foreground space-y-2 text-right">
              <p>1. اضغط على زر <strong className="text-foreground">المشاركة</strong> (المربع مع السهم للأعلى) ⬆️</p>
              <p>2. اختر <strong className="text-foreground">"إضافة إلى الشاشة الرئيسية"</strong></p>
              <p>3. اضغط <strong className="text-foreground">"إضافة"</strong></p>
            </div>
          </div>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="w-full rounded-xl bg-primary text-primary-foreground p-5 text-center font-amiri text-xl flex items-center justify-center gap-3 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-lg"
          >
            <Download size={24} />
            <span>تنزيل التطبيق</span>
          </button>
        ) : (
          <div className="w-full rounded-xl bg-card border border-border p-5 text-center">
            <Download size={32} className="text-primary mx-auto mb-3" />
            <p className="font-amiri text-lg text-foreground mb-2">تنزيل التطبيق</p>
            <p className="text-sm text-muted-foreground">
              افتح هذا الرابط من متصفح Chrome على هاتفك ثم اضغط على قائمة المتصفح واختر "تثبيت التطبيق"
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10 relative z-10 text-center">
        <div className="gold-divider mb-4" />
        <p className="text-xs text-muted-foreground">بسم الله الرحمن الرحيم</p>
      </footer>
    </div>
  );
};

export default DownloadPage;
