export const kinds = ["buddy", "girl", "cat", "blob"] as const;
export const outfits = ["basic", "stripes", "overalls"] as const;
export const bodies = ["regular", "round", "tall"] as const;
export const colors = [
  "#a48de8",
  "#f0a58e",
  "#80bcb0",
  "#e5b857",
  "#91b9de",
  "#e598be",
] as const;
export type Kind = (typeof kinds)[number];
export interface Character {
  kind: Kind;
  name: string;
  outfit: (typeof outfits)[number];
  body: (typeof bodies)[number];
  color: string;
}
export const defaultCharacter: Character = {
  kind: "blob",
  name: "Cục bực bội",
  outfit: "basic",
  body: "regular",
  color: colors[0],
};
export function normalizeCharacter(value: unknown): Character {
  const v = (
    value && typeof value === "object" ? value : {}
  ) as Partial<Character>;
  return {
    kind: kinds.includes(v.kind!) ? v.kind! : defaultCharacter.kind,
    name:
      typeof v.name === "string" && v.name.trim()
        ? Array.from(v.name.trim()).slice(0, 20).join("")
        : defaultCharacter.name,
    outfit: outfits.includes(v.outfit!) ? v.outfit! : "basic",
    body: bodies.includes(v.body!) ? v.body! : "regular",
    color: colors.includes(v.color as (typeof colors)[number])
      ? v.color!
      : colors[0],
  };
}
export function loadCharacter(): Character {
  try {
    return normalizeCharacter(
      JSON.parse(localStorage.getItem("hen1chut.character") || "null"),
    );
  } catch {
    return { ...defaultCharacter };
  }
}
export function saveCharacter(value: Character): boolean {
  try {
    localStorage.setItem(
      "hen1chut.character",
      JSON.stringify(normalizeCharacter(value)),
    );
    return true;
  } catch {
    return false;
  }
}
export function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}
