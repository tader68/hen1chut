import { moodFor, type Mood } from "./reaction";
import { tools, type ToolId } from "../tools/registry";
export interface Mark {
  tool: ToolId;
  x: number;
  y: number;
  variant: number;
}
export interface PlaySession {
  version: 1;
  id: string;
  hits: number;
  mood: Mood;
  marks: Mark[];
  startedAt: number;
  updatedAt: number;
  endedAt: number | null;
}
const KEY = "hen1chut.session.v1";
export function newSession(now = Date.now()): PlaySession {
  return {
    version: 1,
    id: crypto.randomUUID(),
    hits: 0,
    mood: "normal",
    marks: [],
    startedAt: now,
    updatedAt: now,
    endedAt: null,
  };
}
export function normalizeSession(
  value: unknown,
  now = Date.now(),
): PlaySession {
  const v = (
    value && typeof value === "object" ? value : {}
  ) as Partial<PlaySession>;
  if (
    v.version !== 1 ||
    typeof v.id !== "string" ||
    !/^[a-f\d-]{36}$/i.test(v.id) ||
    typeof v.startedAt !== "number" ||
    !Number.isFinite(v.startedAt)
  )
    return newSession(now);
  const hits =
    typeof v.hits === "number" && Number.isFinite(v.hits)
      ? Math.max(0, Math.min(999999, Math.floor(v.hits)))
      : 0;
  return {
    version: 1,
    id: v.id,
    hits,
    mood: moodFor(hits),
    marks: Array.isArray(v.marks)
      ? v.marks
          .filter(
            (m): m is Mark =>
              !!m &&
              tools.some((t) => t.id === m.tool) &&
              Number.isFinite(m.x) &&
              Number.isFinite(m.y) &&
              Number.isFinite(m.variant),
          )
          .slice(-18)
          .map((m) => ({
            ...m,
            x: Math.max(0, Math.min(300, m.x)),
            y: Math.max(60, Math.min(280, m.y)),
            variant: Math.abs(Math.floor(m.variant)) % 3,
          }))
      : [],
    startedAt: Math.min(v.startedAt, now),
    updatedAt:
      typeof v.updatedAt === "number" && Number.isFinite(v.updatedAt)
        ? Math.min(v.updatedAt, now)
        : now,
    endedAt:
      typeof v.endedAt === "number" && Number.isFinite(v.endedAt)
        ? v.endedAt
        : null,
  };
}
export function addImpact(
  session: PlaySession,
  tool: ToolId,
  x: number,
  y: number,
  now = Date.now(),
): PlaySession {
  if (session.endedAt !== null) return session;
  const hits = session.hits + 1;
  return {
    ...session,
    hits,
    mood: moodFor(hits),
    updatedAt: now,
    marks: [
      ...session.marks,
      {
        tool,
        x: Math.max(0, Math.min(300, x)),
        y: Math.max(60, Math.min(280, y)),
        variant: session.hits % 3,
      },
    ].slice(-18),
  };
}
export function loadSession(key = KEY): PlaySession {
  try {
    return normalizeSession(JSON.parse(localStorage.getItem(key) || "null"));
  } catch {
    return newSession();
  }
}
export function saveSession(session: PlaySession, key = KEY): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}
export function renderMarks(marks: Mark[]): string {
  return marks
    .map((m) => {
      const x = m.x,
        y = m.y;
      if (m.tool === "tomato")
        return `<g transform="translate(${x} ${y}) rotate(${m.variant * 35})" fill="#e89a7f" opacity=".8"><path d="M-10-6q5-13 12-3 15-5 10 5 14 11-1 12-2 15-10 4-14 5-11-6-10-9 0-12Z"/><circle cx="-16" cy="-13" r="3"/><circle cx="17" cy="10" r="3"/></g>`;
      if (m.tool === "water")
        return `<g fill="#a0d9e5" opacity=".65"><path d="M${x} ${y - 9}q-15 19 0 19 15 0 0-19Z"/><circle cx="${x + 13}" cy="${y + 13}" r="4"/></g>`;
      if (m.tool === "pillow" || m.tool === "chicken")
        return `<path d="M${x - 9} ${y + 5}q5-16 17-10-5 13-17 10m3-1 8-6" fill="#fff1cf" stroke="#e9d9bc" stroke-width="1"/>`;
      if (m.tool === "confetti")
        return `<g transform="translate(${x} ${y}) rotate(${m.variant * 50})"><rect x="-9" width="7" height="12" rx="1" fill="#e9b2cf"/><rect x="3" y="-7" width="10" height="5" rx="1" fill="#a8cbb0"/></g>`;
      if (m.tool === "banana")
        return `<path d="m${x - 9} ${y - 2}q12 13 20-4" fill="none" stroke="#f0d786" stroke-width="5" stroke-linecap="round"/>`;
      return `<g transform="translate(${x} ${y}) rotate(${m.variant * 25 - 15})" stroke="#77618d" stroke-width="2" opacity=".65"><path d="m-9-5 17 11m-14 2 11-15"/><path d="m-11 3 20-1" stroke-width="1.5"/></g>`;
    })
    .join("");
}
