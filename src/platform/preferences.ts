import { tools, type ToolId } from "../tools/registry";
import { scenes, type SceneId } from "../env/scenes";
export interface Preferences {
  tool: ToolId;
  scene: SceneId;
  haptics: boolean;
}
export function normalizePreferences(value: unknown): Preferences {
  const v = (
    value && typeof value === "object" ? value : {}
  ) as Partial<Preferences>;
  return {
    tool: tools.some((t) => t.id === v.tool) ? v.tool! : "hammer",
    scene: scenes.some((s) => s.id === v.scene) ? v.scene! : "studio",
    haptics: v.haptics === true,
  };
}
export function loadPreferences(key = "hen1chut.preferences.v1"): Preferences {
  try {
    return normalizePreferences(
      JSON.parse(localStorage.getItem(key) || "null"),
    );
  } catch {
    return normalizePreferences(null);
  }
}
export function savePreferences(
  value: Preferences,
  key = "hen1chut.preferences.v1",
): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Preferences are optional. */
  }
}
