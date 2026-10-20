import { normalizeCharacter, type Character } from "../character/model";
import { scenes, type SceneId } from "../env/scenes";
export interface SharedPreset {
  character: Character;
  scene: SceneId;
}
export function presetUrl(
  character: Character,
  scene: SceneId,
  base: string,
): string {
  const safe = normalizeCharacter({ ...character, name: "Bạn hứng bực" });
  const params = new URLSearchParams({
    v: "1",
    k: safe.kind,
    c: safe.color,
    o: safe.outfit,
    b: safe.body,
    h: safe.hat,
    g: safe.glasses,
    s: scene,
  });
  const url = new URL(base);
  url.search = "";
  url.hash = `ban=${encodeURIComponent(params.toString())}`;
  return url.toString();
}
export function parsePreset(hash: string): SharedPreset | null {
  if (hash.length > 600 || !hash.startsWith("#ban=")) return null;
  try {
    const params = new URLSearchParams(decodeURIComponent(hash.slice(5)));
    if (params.get("v") !== "1") return null;
    const scene = params.get("s");
    return {
      character: normalizeCharacter({
        kind: params.get("k"),
        color: params.get("c"),
        outfit: params.get("o"),
        body: params.get("b"),
        hat: params.get("h"),
        glasses: params.get("g"),
        name: "Bạn hứng bực",
      }),
      scene: scenes.some((s) => s.id === scene) ? (scene as SceneId) : "studio",
    };
  } catch {
    return null;
  }
}
