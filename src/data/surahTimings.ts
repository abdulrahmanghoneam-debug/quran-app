// Precise timing data for each surah's audio segments
// Each segment maps to verse(s) with sheikh and child recitation start times

export interface AudioSegment {
  verses: string; // e.g. "1-3", "البسملة", "الاستعاذة"
  sheikhStart: number; // seconds
  childStart: number; // seconds
}

export interface SurahTiming {
  quranSurahId: number;
  segments: AudioSegment[];
}

function parseTime(t: string): number {
  const [m, s] = t.split(":").map(Number);
  return m * 60 + s;
}

// Returns which verse numbers a segment covers (null for basmala/isti'adha)
export function parseVerseRange(verses: string): number[] | null {
  if (verses === "البسملة" || verses === "الاستعاذة") return null;
  if (verses.includes("-")) {
    const [start, end] = verses.split("-").map(Number);
    const result: number[] = [];
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  }
  return [Number(verses)];
}

// Find active segment index based on current playback time
export function getActiveSegmentIndex(
  segments: AudioSegment[],
  currentTime: number
): number {
  for (let i = segments.length - 1; i >= 0; i--) {
    if (currentTime >= segments[i].sheikhStart) return i;
  }
  return 0;
}

// Get all verse numbers that are active for a given segment
export function getActiveVerses(segment: AudioSegment): number[] {
  return parseVerseRange(segment.verses) ?? [];
}

// Map from app surah ID (1-38) to timing data
const timingsMap: Record<number, SurahTiming> = {};

const rawData: Array<{
  appId: number;
  quranId: number;
  segments: Array<{ verses: string; sheikh_start: string; child_start: string }>;
}> = [
  {
    appId: 1, quranId: 1, segments: [
      { verses: "الاستعاذة", sheikh_start: "0:01", child_start: "0:07" },
      { verses: "البسملة", sheikh_start: "0:12", child_start: "0:17" },
      { verses: "2", sheikh_start: "0:22", child_start: "0:26" },
      { verses: "3", sheikh_start: "0:31", child_start: "0:35" },
      { verses: "4", sheikh_start: "0:40", child_start: "0:45" },
      { verses: "5", sheikh_start: "0:51", child_start: "0:58" },
      { verses: "6", sheikh_start: "1:05", child_start: "1:11" },
      { verses: "7", sheikh_start: "1:18", child_start: "1:27" },
    ],
  },
  {
    appId: 2, quranId: 78, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:05" },
      { verses: "1-3", sheikh_start: "0:09", child_start: "0:28" },
      { verses: "4-5", sheikh_start: "0:34", child_start: "0:46" },
      { verses: "6-7", sheikh_start: "0:50", child_start: "0:59" },
      { verses: "8-11", sheikh_start: "1:07", child_start: "1:21" },
      { verses: "12-14", sheikh_start: "1:36", child_start: "1:52" },
      { verses: "15-16", sheikh_start: "2:06", child_start: "2:16" },
      { verses: "17-18", sheikh_start: "2:28", child_start: "2:39" },
      { verses: "19-20", sheikh_start: "2:48", child_start: "2:54" },
      { verses: "21-23", sheikh_start: "3:00", child_start: "3:15" },
      { verses: "24-26", sheikh_start: "3:33", child_start: "3:45" },
      { verses: "27-30", sheikh_start: "4:00", child_start: "4:18" },
      { verses: "31-34", sheikh_start: "4:38", child_start: "4:54" },
      { verses: "35-36", sheikh_start: "5:10", child_start: "5:24" },
      { verses: "37", sheikh_start: "5:39", child_start: "5:51" },
      { verses: "38", sheikh_start: "6:04", child_start: "6:23" },
      { verses: "39", sheikh_start: "6:44", child_start: "6:54" },
      { verses: "40", sheikh_start: "7:06", child_start: "7:27" },
    ],
  },
  {
    appId: 3, quranId: 79, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-5", sheikh_start: "0:10", child_start: "0:35" },
      { verses: "6-9", sheikh_start: "0:41", child_start: "1:00" },
      { verses: "10-12", sheikh_start: "1:16", child_start: "1:31" },
      { verses: "13-14", sheikh_start: "1:47", child_start: "1:56" },
      { verses: "15-19", sheikh_start: "2:05", child_start: "2:26" },
      { verses: "20-25", sheikh_start: "2:43", child_start: "2:54" },
      { verses: "26-29", sheikh_start: "3:07", child_start: "3:24" },
      { verses: "30-33", sheikh_start: "3:45", child_start: "4:06" },
      { verses: "34-36", sheikh_start: "4:32", child_start: "4:48" },
      { verses: "37-39", sheikh_start: "5:06", child_start: "5:18" },
      { verses: "40-41", sheikh_start: "5:32", child_start: "5:46" },
      { verses: "42-44", sheikh_start: "6:03", child_start: "6:22" },
      { verses: "45-46", sheikh_start: "6:43", child_start: "7:02" },
    ],
  },
  {
    appId: 4, quranId: 80, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:37" },
      { verses: "5-10", sheikh_start: "0:45", child_start: "1:12" },
      { verses: "11-16", sheikh_start: "1:33", child_start: "1:58" },
      { verses: "17-22", sheikh_start: "2:17", child_start: "2:38" },
      { verses: "23", sheikh_start: "2:45", child_start: "2:48" },
      { verses: "24-28", sheikh_start: "2:52", child_start: "3:08" },
      { verses: "29-32", sheikh_start: "3:24", child_start: "3:38" },
      { verses: "33-36", sheikh_start: "3:55", child_start: "4:13" },
      { verses: "37-39", sheikh_start: "4:33", child_start: "4:48" },
      { verses: "40-42", sheikh_start: "5:02", child_start: "5:18" },
    ],
  },
  {
    appId: 5, quranId: 81, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-6", sheikh_start: "0:10", child_start: "0:49" },
      { verses: "7-11", sheikh_start: "1:07", child_start: "1:34" },
      { verses: "12-14", sheikh_start: "1:53", child_start: "2:10" },
      { verses: "15-18", sheikh_start: "2:24", child_start: "2:42" },
      { verses: "19-21", sheikh_start: "3:00", child_start: "3:15" },
      { verses: "22-25", sheikh_start: "3:29", child_start: "3:50" },
      { verses: "26-29", sheikh_start: "4:12", child_start: "4:40" },
    ],
  },
  {
    appId: 6, quranId: 82, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-5", sheikh_start: "0:10", child_start: "0:46" },
      { verses: "6", sheikh_start: "0:57", child_start: "1:06" },
      { verses: "7-8", sheikh_start: "1:15", child_start: "1:24" },
      { verses: "9-12", sheikh_start: "1:34", child_start: "1:52" },
      { verses: "13-16", sheikh_start: "2:12", child_start: "2:32" },
      { verses: "17-19", sheikh_start: "2:56", child_start: "3:18" },
    ],
  },
  {
    appId: 7, quranId: 83, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:03" },
      { verses: "1-3", sheikh_start: "0:04", child_start: "0:27" },
      { verses: "4-6", sheikh_start: "0:54", child_start: "1:16" },
      { verses: "7-9", sheikh_start: "1:40", child_start: "2:05" },
      { verses: "10-12", sheikh_start: "2:28", child_start: "3:00" },
      { verses: "13-14", sheikh_start: "3:20", child_start: "3:45" },
      { verses: "15-17", sheikh_start: "4:07", child_start: "4:46" },
      { verses: "18-21", sheikh_start: "5:10", child_start: "5:53" },
      { verses: "22-26", sheikh_start: "6:04", child_start: "6:50" },
      { verses: "27-30", sheikh_start: "7:30", child_start: "8:25" },
      { verses: "31-33", sheikh_start: "8:39", child_start: "9:20" },
      { verses: "34-36", sheikh_start: "9:50", child_start: "10:22" },
    ],
  },
  {
    appId: 8, quranId: 84, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-5", sheikh_start: "0:10", child_start: "0:42" },
      { verses: "6", sheikh_start: "0:54", child_start: "1:05" },
      { verses: "7-9", sheikh_start: "1:16", child_start: "1:32" },
      { verses: "10-15", sheikh_start: "1:49", child_start: "2:18" },
      { verses: "16-19", sheikh_start: "2:42", child_start: "3:00" },
      { verses: "20-21", sheikh_start: "3:18", child_start: "3:30" },
      { verses: "22-25", sheikh_start: "3:47", child_start: "4:12" },
    ],
  },
  {
    appId: 9, quranId: 85, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:33" },
      { verses: "4-7", sheikh_start: "0:43", child_start: "1:10" },
      { verses: "8-9", sheikh_start: "1:30", child_start: "1:50" },
      { verses: "10", sheikh_start: "2:05", child_start: "2:20" },
      { verses: "11", sheikh_start: "2:34", child_start: "2:52" },
      { verses: "12-16", sheikh_start: "3:13", child_start: "3:33" },
      { verses: "17-18", sheikh_start: "3:55", child_start: "4:03" },
      { verses: "19-20", sheikh_start: "4:13", child_start: "4:24" },
      { verses: "21-22", sheikh_start: "4:36", child_start: "4:48" },
    ],
  },
  {
    appId: 10, quranId: 86, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:38" },
      { verses: "5-7", sheikh_start: "0:48", child_start: "1:02" },
      { verses: "8", sheikh_start: "1:10", child_start: "1:14" },
      { verses: "9-10", sheikh_start: "1:19", child_start: "1:28" },
      { verses: "11-14", sheikh_start: "1:40", child_start: "1:58" },
      { verses: "15-17", sheikh_start: "2:16", child_start: "2:34" },
    ],
  },
  {
    appId: 11, quranId: 87, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:21" },
      { verses: "4-5", sheikh_start: "0:35", child_start: "0:41" },
      { verses: "6-7", sheikh_start: "0:50", child_start: "1:02" },
      { verses: "8-9", sheikh_start: "1:16", child_start: "1:23" },
      { verses: "10-13", sheikh_start: "1:29", child_start: "1:44" },
      { verses: "14-15", sheikh_start: "2:03", child_start: "2:13" },
      { verses: "16-17", sheikh_start: "2:25", child_start: "2:35" },
      { verses: "18-19", sheikh_start: "2:48", child_start: "2:58" },
    ],
  },
  {
    appId: 12, quranId: 88, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:22" },
      { verses: "5-7", sheikh_start: "0:37", child_start: "0:47" },
      { verses: "8-10", sheikh_start: "0:59", child_start: "1:11" },
      { verses: "11-12", sheikh_start: "1:23", child_start: "1:29" },
      { verses: "13-16", sheikh_start: "1:36", child_start: "1:48" },
      { verses: "17-20", sheikh_start: "2:05", child_start: "2:24" },
      { verses: "21-22", sheikh_start: "2:47", child_start: "2:54" },
      { verses: "23-24", sheikh_start: "3:03", child_start: "3:12" },
      { verses: "25-26", sheikh_start: "3:25", child_start: "3:33" },
    ],
  },
  {
    appId: 13, quranId: 89, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-5", sheikh_start: "0:10", child_start: "0:24" },
      { verses: "6-8", sheikh_start: "0:43", child_start: "0:58" },
      { verses: "9-10", sheikh_start: "1:14", child_start: "1:25" },
      { verses: "11-12", sheikh_start: "1:38", child_start: "1:46" },
      { verses: "13-14", sheikh_start: "1:57", child_start: "2:04" },
      { verses: "15-16", sheikh_start: "2:13", child_start: "2:37" },
      { verses: "17-20", sheikh_start: "3:05", child_start: "3:24" },
      { verses: "21-23", sheikh_start: "3:45", child_start: "4:13" },
      { verses: "24-26", sheikh_start: "4:48", child_start: "5:06" },
      { verses: "27-30", sheikh_start: "5:28", child_start: "5:44" },
    ],
  },
  {
    appId: 14, quranId: 90, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:26" },
      { verses: "5-7", sheikh_start: "0:44", child_start: "0:59" },
      { verses: "8-10", sheikh_start: "1:14", child_start: "1:22" },
      { verses: "11-13", sheikh_start: "1:30", child_start: "1:42" },
      { verses: "14-16", sheikh_start: "1:57", child_start: "2:12" },
      { verses: "17-18", sheikh_start: "2:31", child_start: "2:47" },
      { verses: "19-20", sheikh_start: "3:06", child_start: "3:19" },
    ],
  },
  {
    appId: 15, quranId: 91, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:26" },
      { verses: "5-6", sheikh_start: "0:43", child_start: "0:52" },
      { verses: "7-8", sheikh_start: "1:02", child_start: "1:11" },
      { verses: "9-10", sheikh_start: "1:19", child_start: "1:29" },
      { verses: "11-12", sheikh_start: "1:41", child_start: "1:53" },
      { verses: "13", sheikh_start: "2:08", child_start: "2:19" },
      { verses: "14-15", sheikh_start: "2:32", child_start: "2:52" },
    ],
  },
  {
    appId: 16, quranId: 92, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:25" },
      { verses: "5-7", sheikh_start: "0:41", child_start: "0:52" },
      { verses: "8-11", sheikh_start: "1:04", child_start: "1:25" },
      { verses: "12-13", sheikh_start: "1:42", child_start: "1:52" },
      { verses: "14-16", sheikh_start: "2:05", child_start: "2:19" },
      { verses: "17-18", sheikh_start: "2:37", child_start: "2:48" },
      { verses: "19-21", sheikh_start: "3:02", child_start: "3:22" },
    ],
  },
  {
    appId: 17, quranId: 93, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:21" },
      { verses: "4-5", sheikh_start: "0:31", child_start: "0:41" },
      { verses: "6-8", sheikh_start: "0:49", child_start: "1:07" },
      { verses: "9-11", sheikh_start: "1:28", child_start: "1:47" },
    ],
  },
  {
    appId: 18, quranId: 94, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:29" },
      { verses: "5-6", sheikh_start: "0:44", child_start: "0:52" },
      { verses: "7-8", sheikh_start: "1:01", child_start: "1:12" },
    ],
  },
  {
    appId: 19, quranId: 95, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:21" },
      { verses: "4-6", sheikh_start: "0:31", child_start: "0:49" },
      { verses: "7-8", sheikh_start: "1:07", child_start: "1:16" },
    ],
  },
  {
    appId: 20, quranId: 96, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-5", sheikh_start: "0:10", child_start: "0:24" },
      { verses: "6-8", sheikh_start: "0:40", child_start: "0:51" },
      { verses: "9-14", sheikh_start: "1:03", child_start: "1:24" },
      { verses: "15-19", sheikh_start: "1:44", child_start: "2:07" },
    ],
  },
  {
    appId: 21, quranId: 97, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:26" },
      { verses: "4-5", sheikh_start: "0:41", child_start: "0:58" },
    ],
  },
  {
    appId: 22, quranId: 98, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:38" },
      { verses: "5", sheikh_start: "1:05", child_start: "1:21" },
      { verses: "6-8", sheikh_start: "1:37", child_start: "2:12" },
    ],
  },
  {
    appId: 23, quranId: 99, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:23" },
      { verses: "4-5", sheikh_start: "0:36", child_start: "0:47" },
      { verses: "6-8", sheikh_start: "0:58", child_start: "1:15" },
    ],
  },
  {
    appId: 24, quranId: 100, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-5", sheikh_start: "0:10", child_start: "0:22" },
      { verses: "6-8", sheikh_start: "0:34", child_start: "0:44" },
      { verses: "9-11", sheikh_start: "0:54", child_start: "1:07" },
    ],
  },
  {
    appId: 25, quranId: 101, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-5", sheikh_start: "0:10", child_start: "0:24" },
      { verses: "6-9", sheikh_start: "0:39", child_start: "0:51" },
      { verses: "10-11", sheikh_start: "1:03", child_start: "1:10" },
    ],
  },
  {
    appId: 26, quranId: 102, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:21" },
      { verses: "5-8", sheikh_start: "0:33", child_start: "0:51" },
    ],
  },
  {
    appId: 27, quranId: 103, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:22" },
    ],
  },
  {
    appId: 28, quranId: 104, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:25" },
      { verses: "5-9", sheikh_start: "0:39", child_start: "0:58" },
    ],
  },
  {
    appId: 29, quranId: 105, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:26" },
      { verses: "4-5", sheikh_start: "0:42", child_start: "0:54" },
    ],
  },
  {
    appId: 30, quranId: 106, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:28" },
    ],
  },
  {
    appId: 31, quranId: 107, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:25" },
      { verses: "4-7", sheikh_start: "0:41", child_start: "0:54" },
    ],
  },
  {
    appId: 32, quranId: 108, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:22" },
    ],
  },
  {
    appId: 33, quranId: 109, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:24" },
      { verses: "4-6", sheikh_start: "0:37", child_start: "0:51" },
    ],
  },
  {
    appId: 34, quranId: 110, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:29" },
    ],
  },
  {
    appId: 35, quranId: 111, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-2", sheikh_start: "0:10", child_start: "0:21" },
      { verses: "3-5", sheikh_start: "0:31", child_start: "0:45" },
    ],
  },
  {
    appId: 36, quranId: 112, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-4", sheikh_start: "0:10", child_start: "0:22" },
    ],
  },
  {
    appId: 37, quranId: 113, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-5", sheikh_start: "0:10", child_start: "0:31" },
    ],
  },
  {
    appId: 38, quranId: 114, segments: [
      { verses: "البسملة", sheikh_start: "0:01", child_start: "0:06" },
      { verses: "1-3", sheikh_start: "0:10", child_start: "0:23" },
      { verses: "4-6", sheikh_start: "0:36", child_start: "0:54" },
    ],
  },
];

// Build the map
rawData.forEach(({ appId, quranId, segments }) => {
  timingsMap[appId] = {
    quranSurahId: quranId,
    segments: segments.map((s) => ({
      verses: s.verses,
      sheikhStart: parseTime(s.sheikh_start),
      childStart: parseTime(s.child_start),
    })),
  };
});

export function getSurahTiming(appSurahId: number): SurahTiming | null {
  return timingsMap[appSurahId] ?? null;
}
