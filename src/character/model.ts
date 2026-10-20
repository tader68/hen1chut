export const kinds = ["buddy", "girl", "cat", "blob"] as const;
export const outfits = [
  "basic",
  "stripes",
  "overalls",
  "hoodie",
  "suit",
  "pajamas",
  "sport",
  "raincoat",
  "astronaut",
  "bomber",
  "denim",
  "kimono",
] as const;
export const hats = [
  "none",
  "beanie",
  "cap",
  "bucket",
  "crown",
  "bow",
  "headphones",
  "party",
] as const;
export const glasses = ["none", "round", "sun", "star", "sleep"] as const;
export const outfitLabels: Record<(typeof outfits)[number], string> = {
  basic: "Đồ ở nhà",
  stripes: "Áo kẻ chill chill",
  overalls: "Quần yếm",
  hoodie: "Hoodie ôm ấm",
  suit: "Vest đi họp",
  pajamas: "Đồ ngủ mây",
  sport: "Áo thể thao",
  raincoat: "Áo mưa tí hon",
  astronaut: "Phi hành gia",
  bomber: "Bomber bụi bặm",
  denim: "Áo denim",
  kimono: "Áo khoác hoa",
};
export const hatLabels: Record<(typeof hats)[number], string> = {
  none: "Đầu trần",
  beanie: "Mũ len",
  cap: "Mũ lưỡi trai",
  bucket: "Mũ tai bèo",
  crown: "Vương miện",
  bow: "Nơ xinh",
  headphones: "Tai nghe",
  party: "Mũ tiệc",
};
export const glassesLabels: Record<(typeof glasses)[number], string> = {
  none: "Không đeo",
  round: "Kính tròn",
  sun: "Kính râm",
  star: "Kính ngôi sao",
  sleep: "Bịt mắt ngủ",
};
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
  hat: (typeof hats)[number];
  glasses: (typeof glasses)[number];
}
export const defaultCharacter: Character = {
  kind: "blob",
  name: "Cục bực bội",
  outfit: "basic",
  body: "regular",
  color: colors[0],
  hat: "none",
  glasses: "none",
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
    hat: hats.includes(v.hat!) ? v.hat! : "none",
    glasses: glasses.includes(v.glasses!) ? v.glasses! : "none",
    body: bodies.includes(v.body!) ? v.body! : "regular",
    color: colors.includes(v.color as (typeof colors)[number])
      ? v.color!
      : colors[0],
  };
}
export function loadCharacter(key = "hen1chut.character"): Character {
  try {
    return normalizeCharacter(JSON.parse(localStorage.getItem(key) || "null"));
  } catch {
    return { ...defaultCharacter };
  }
}
export function saveCharacter(
  value: Character,
  key = "hen1chut.character",
): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(normalizeCharacter(value)));
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
