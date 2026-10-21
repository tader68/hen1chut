import { tools, type ToolId } from "../tools/registry";
import { normalizeDiscoveries, type DiscoveryId } from "./discoveries";
const STORAGE = "hen1chut.daily.v1";
const DAY = /^\d{4}-\d{2}-\d{2}$/;
export interface DailyProgress {
  day: string;
  hits: number;
  tools: ToolId[];
  breathed: boolean;
  completedDays: string[];
  discoveries?: DiscoveryId[];
}
export function localDay(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function normalizeProgress(
  value: unknown,
  day = localDay(),
): DailyProgress {
  const v =
    value && typeof value === "object" ? (value as Partial<DailyProgress>) : {};
  const sameDay = v.day === day;
  return {
    day,
    hits:
      sameDay && typeof v.hits === "number" && Number.isFinite(v.hits)
        ? Math.max(0, Math.min(99999, Math.floor(v.hits)))
        : 0,
    tools:
      sameDay && Array.isArray(v.tools)
        ? [
            ...new Set(
              v.tools.filter((id): id is ToolId =>
                tools.some((t) => t.id === id),
              ),
            ),
          ]
        : [],
    breathed: sameDay && v.breathed === true,
    completedDays: Array.isArray(v.completedDays)
      ? [
          ...new Set(
            v.completedDays.filter(
              (d): d is string =>
                typeof d === "string" && DAY.test(d) && d <= day,
            ),
          ),
        ]
          .sort()
          .slice(-90)
      : [],
    discoveries: normalizeDiscoveries(v.discoveries),
  };
}
export function dailyTasks(
  progress: DailyProgress,
): { id: string; label: string; done: boolean; value: string }[] {
  return [
    {
      id: "hits",
      label: "Gửi lại 12 chút bực bội",
      done: progress.hits >= 12,
      value: `${Math.min(12, progress.hits)}/12`,
    },
    {
      id: "tools",
      label: "Thử 3 món đồ chơi",
      done: progress.tools.length >= 3,
      value: `${Math.min(3, progress.tools.length)}/3`,
    },
    {
      id: "breathe",
      label: "Thở chậm một nhịp",
      done: progress.breathed,
      value: progress.breathed ? "Xong rồi" : "8 giây",
    },
  ];
}
export function isDailyComplete(progress: DailyProgress): boolean {
  return dailyTasks(progress).every((t) => t.done);
}
export function recordProgress(
  progress: DailyProgress,
  event: { type: "hit"; tool: ToolId } | { type: "breath" } | { type: "discovery"; id: DiscoveryId },
  day = localDay(),
): DailyProgress {
  const next = normalizeProgress(progress, day);
  if (event.type === "hit") {
    next.hits++;
    if (!next.tools.includes(event.tool)) next.tools.push(event.tool);
  } else if (event.type === "breath") next.breathed = true;
  else next.discoveries = normalizeDiscoveries([...(next.discoveries || []), event.id]);
  if (isDailyComplete(next) && !next.completedDays.includes(day))
    next.completedDays.push(day);
  return next;
}
export function loadProgress(key = STORAGE): DailyProgress {
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(key) || "null"));
  } catch {
    return normalizeProgress(null);
  }
}
export function saveProgress(progress: DailyProgress, key = STORAGE): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
const notes = [
  ["Bỏ bực vào túi, gửi lên mây.", "Không cần mang mọi chuyện theo mình."],
  ["Một ngày hơi rối. Một phút thật riêng.", "Chậm một chút, cũng vẫn kịp mà."],
  [
    "Hôm nay, nhẹ tay với mình nhé.",
    "Bạn không cần hoàn hảo để được nghỉ ngơi.",
  ],
  ["Mưa một chút rồi trời lại trong.", "Có những chuyện cứ để ngày mai."],
  [
    "Tắt tiếng ồn. Bật chút vui.",
    "Ở đây, bạn không cần phải làm gì thật giỏi.",
  ],
  [
    "Gửi một cái bực. Nhận một nụ cười.",
    "Một khoảng nghỉ bé xíu, dành riêng cho bạn.",
  ],
  ["Đặt ngày dài xuống một lát.", "Chỉ một phút cho mình thôi."],
] as const;
export function dailyNote(day = localDay()): readonly [string, string] {
  const seed = Array.from(day).reduce(
    (n, c) => (n * 31 + c.charCodeAt(0)) >>> 0,
    0,
  );
  return notes[seed % notes.length];
}
