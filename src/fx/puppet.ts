import type { ToolId } from "../tools/registry";

const pose = (transform: string, offset: number): Keyframe => ({ transform, offset, easing: "cubic-bezier(.22,1,.36,1)" });
const parts = { head: ".pose-head", body: ".pose-body", left: ".pose-arm-left", right: ".pose-arm-right", tuft: ".pose-tuft", mouth: ".pose-mouth" } as const;
type Pose = Partial<Record<keyof typeof parts, string>>;
export function capturePuppetPose(figure: HTMLElement): Pose {
  return Object.fromEntries(Object.entries(parts).flatMap(([part, selector]) => {
    const element = figure.querySelector(selector);
    return element ? [[part, getComputedStyle(element).transform]] : [];
  }));
}
export function puppetMotion(tool: ToolId, direction: number, duration: number) {
  const side = direction < 0 ? -1 : 1;
  const soft = tool === "pillow" || tool === "water";
  const lift = tool === "confetti" || tool === "lightning";
  const angle = (soft ? 7 : tool === "boxing" || tool === "slipper" ? 17 : 12) * side;
  const dip = lift ? -12 : tool === "hammer" ? 15 : 5;
  const frames = (contact: string, follow: string, settle = "none") => [
    pose("none", 0),
    pose(contact, .18),
    pose(follow, .53),
    pose(settle, .79),
    pose("none", 1),
  ];
  return {
    duration: duration + 90,
    head: frames(
      `translate(${side * (soft ? 5 : 12)}px,${dip}px) rotate(${angle}deg) scale(${soft ? 1.03 : .94},${soft ? .97 : 1.04})`,
      `translate(${-side * 3}px,${lift ? -6 : -3}px) rotate(${-angle * .28}deg)`,
      `rotate(${angle * .1}deg)`,
    ),
    body: frames(
      `rotate(${-side * 4}deg) scale(${soft ? .98 : 1.08},${soft ? 1.02 : .91})`,
      "scale(.99,1.015)",
    ),
    left: frames(`rotate(${lift ? -50 : -side * 35}deg)`, `rotate(${side * 9}deg)`),
    right: frames(`rotate(${lift ? 50 : side * 35}deg)`, `rotate(${-side * 9}deg)`),
    tuft: frames(`rotate(${-angle * 1.25}deg)`, `rotate(${angle * .45}deg)`),
    mouth: frames(soft ? "scale(1.15,.8)" : "scale(.85,1.22)", "scale(1.04,.95)"),
  };
}

export function animatePuppet(figure: HTMLElement, tool: ToolId, direction: number, duration: number, carried: Pose = {}): Animation[] {
  const motion = puppetMotion(tool, direction, duration);
  return Object.entries(parts).flatMap(([part, selector]) => {
    const element = figure.querySelector(selector);
    if (!element) return [];
    const key = part as keyof typeof parts;
    const frames = motion[key].map((frame, index) => index === 0 && carried[key] ? {...frame, transform: carried[key]} : frame);
    return [element.animate(frames, {
      duration: motion.duration,
      easing: "linear",
    })];
  });
}
