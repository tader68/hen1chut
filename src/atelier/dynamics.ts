import type { ToolId } from "../tools/registry";
export type Toy = "punch" | ToolId;
export type Costume = "original" | "dragon" | "mecha";

export interface Spring { value: number; velocity: number }
export const spring = (): Spring => ({ value: 0, velocity: 0 });

// Substeps keep repeated impacts stable even when a phone drops a frame.
export function advance(s: Spring, delta: number, stiffness = 150, damping = 13): void {
  let remaining = Math.max(0, Math.min(delta, .05));
  while (remaining > 0) {
    const dt = Math.min(remaining, 1 / 240);
    s.velocity += (-stiffness * s.value - damping * s.velocity) * dt;
    s.value += s.velocity * dt;
    remaining -= dt;
  }
}

export function impulse(toy: Toy): { tilt: number; squash: number; lift: number; face: number } {
  const profiles: Record<Toy, { tilt: number; squash: number; lift: number; face: number }> = {
    punch: { tilt: 6, squash: -2.8, lift: 2.3, face: .8 },
    boxing: { tilt: 6, squash: -2.8, lift: 2.3, face: .8 },
    hammer: { tilt: 3.8, squash: -5.5, lift: 1.7, face: .9 },
    pillow: { tilt: 1.7, squash: -2.2, lift: 1, face: .65 },
    tomato: { tilt: 3.1, squash: -1.9, lift: .8, face: .85 },
    water: { tilt: 2.2, squash: -2.1, lift: .6, face: .85 },
    boot: { tilt: 7.4, squash: -3.2, lift: 4.2, face: .95 },
    lightning: { tilt: 1.5, squash: -3.8, lift: 2.1, face: 1 },
    spring: { tilt: 5.5, squash: -4.8, lift: 3.7, face: .9 },
    slipper: { tilt: 5.2, squash: -2.1, lift: 1.9, face: .85 },
    chicken: { tilt: 3, squash: -3.7, lift: 1.4, face: .7 },
    banana: { tilt: 7.8, squash: -2.4, lift: 2.3, face: .9 },
    confetti: { tilt: 1.3, squash: -1.1, lift: 3, face: .7 },
  };
  return profiles[toy];
}
