// Maps app surah ID to actual Quran surah number
export function getQuranSurahNumber(appId: number): number {
  if (appId === 1) return 1; // Al-Fatiha
  return appId + 76; // App ID 2 = Surah 78 (An-Naba), ..., App ID 38 = Surah 114 (An-Nas)
}

const CACHE_KEY = "quran-verses-cache";

interface CachedVerses {
  [surahNumber: string]: string[];
}

function loadCache(): CachedVerses {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
  } catch { }
  return {};
}

function saveToCache(surahNumber: number, verses: string[]) {
  try {
    const cache = loadCache();
    cache[surahNumber.toString()] = verses;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch { }
}

export async function fetchSurahVerses(appSurahId: number): Promise<string[]> {
  const quranNumber = getQuranSurahNumber(appSurahId);

  // Check cache first
  const cache = loadCache();
  if (cache[quranNumber.toString()]) {
    return cache[quranNumber.toString()];
  }

  try {
    const response = await fetch(
      `https://api.alquran.cloud/v1/surah/${quranNumber}/quran-simple`
    );
    const data = await response.json();

    if (data.code === 200 && data.data?.ayahs) {
      const verses: string[] = data.data.ayahs.map((ayah: { text: string }) =>
        ayah.text.replace(/^\uFEFF/, '').trim()
      );
      saveToCache(quranNumber, verses);
      return verses;
    }
  } catch (err) {
    console.warn("Failed to fetch verses:", err);
  }

  return [];
}

// جميع معرّفات السور في التطبيق (38 سورة)
const ALL_APP_SURAH_IDS = Array.from({ length: 38 }, (_, i) => i + 1);

/**
 * يُستدعى عند بدء التطبيق: يحمّل جميع السور في الخلفية ويحفظها
 * حتى تعمل الآيات بدون إنترنت في الزيارات اللاحقة
 */
export async function prefetchAllVerses(): Promise<void> {
  if (!navigator.onLine) return;
  const cache = loadCache();

  for (const appId of ALL_APP_SURAH_IDS) {
    const quranNumber = getQuranSurahNumber(appId);
    if (cache[quranNumber.toString()]) continue; // محفوظة مسبقاً

    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/surah/${quranNumber}/quran-simple`
      );
      const data = await response.json();
      if (data.code === 200 && data.data?.ayahs) {
        const verses: string[] = data.data.ayahs.map(
          (ayah: { text: string }) => ayah.text.replace(/^\uFEFF/, "").trim()
        );
        saveToCache(quranNumber, verses);
      }
    } catch {
      // تجاهل الأخطاء والمتابعة
    }
    await new Promise((r) => setTimeout(r, 300));
  }
}
