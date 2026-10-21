import type { ToolId } from "../tools/registry";
const frame = (transform: string, offset?: number): Keyframe => ({
  transform,
  ...(offset === undefined ? {} : { offset }),
});
export function impactMotion(
  id: ToolId,
  space = false,
  direction?: number,
): { figure: Keyframe[]; weapon: Keyframe[]; duration: number } {
  const figures: Record<ToolId, Keyframe[]> = {
    hammer: [
      frame("scale(1)"),
      frame("translateY(15px) scale(1.17,.8) rotate(-5deg)", 0.23),
      frame("translateY(-6px) scale(.97,1.04)", 0.65),
      frame("scale(1)"),
    ],
    pillow: [
      frame("scale(1)"),
      frame("translateX(-18px) scale(.88,1.04) rotate(-8deg)", 0.3),
      frame("translateX(3px) rotate(2deg)", 0.7),
      frame("scale(1)"),
    ],
    tomato: [
      frame("scale(1)"),
      frame("translate(9px,2px) rotate(9deg) scale(.95)", 0.27),
      frame("rotate(-3deg)", 0.65),
      frame("scale(1)"),
    ],
    water: [
      frame("scale(1)"),
      frame("translateY(-7px) scale(.95,1.03)", 0.25),
      frame("rotate(-5deg)", 0.48),
      frame("rotate(4deg)", 0.68),
      frame("scale(1)"),
    ],
    boot: [
      frame("scale(1)"),
      frame("translate(43px,-16px) rotate(29deg) scale(.95)", 0.32),
      frame("translate(10px,-5px) rotate(8deg)", 0.75),
      frame("scale(1)"),
    ],
    lightning: [
      frame("scale(1)"),
      frame("translateY(-23px) scale(.93,1.1)", 0.15),
      frame("translateY(-12px) rotate(-7deg)", 0.4),
      frame("translateY(-7px) rotate(5deg)", 0.65),
      frame("scale(1)"),
    ],
    boxing: [
      frame("scale(1)"),
      frame("translate(46px,0) scale(.85,1.05) rotate(17deg)", 0.2),
      frame("translate(12px,0) rotate(5deg)", 0.7),
      frame("scale(1)"),
    ],
    spring: [
      frame("scale(1)"),
      frame("translate(55px,-4px) scale(1.12,.91) rotate(12deg)", 0.22),
      frame("translate(5px,0) scale(.97,1.02)", 0.7),
      frame("scale(1)"),
    ],
    slipper: [
      frame("scale(1)"),
      frame("translate(-29px,8px) rotate(-22deg) scale(.95)", 0.22),
      frame("rotate(5deg)", 0.7),
      frame("scale(1)"),
    ],
    chicken: [
      frame("scale(1)"),
      frame("translateY(-8px) rotate(-12deg) scale(1.05,.95)", 0.23),
      frame("translateY(-4px) rotate(11deg)", 0.55),
      frame("scale(1)"),
    ],
    banana: [
      frame("scale(1)"),
      frame("translate(47px,30px) rotate(66deg) scale(.96)", 0.4),
      frame("translate(14px,8px) rotate(18deg)", 0.78),
      frame("scale(1)"),
    ],
    confetti: [
      frame("scale(1)"),
      frame("translateY(-24px) rotate(-7deg) scale(1.03)", 0.32),
      frame("translateY(-10px) rotate(7deg)", 0.68),
      frame("scale(1)"),
    ],
  };
  const isThrow = ["tomato", "water", "slipper", "banana"].includes(id),
    isPunch = ["boxing", "spring"].includes(id);
  const weapon: Keyframe[] =
    id === "lightning"
      ? [
          { opacity: 0, transform: "translate(-50%,-150px) scale(.6,1.7)" },
          {
            opacity: 1,
            transform: "translate(-50%,-70px) scale(1,1.3)",
            offset: 0.25,
          },
          { opacity: 0, transform: "translate(-50%,-20px) scale(.8,.6)" },
        ]
      : isPunch
        ? [
            { opacity: 0, transform: "translate(-170px,-40px) rotate(75deg)" },
            {
              opacity: 1,
              transform: "translate(-45px,-40px) rotate(75deg)",
              offset: 0.3,
            },
            {
              opacity: 0,
              transform: "translate(-100px,-40px) rotate(75deg) scale(.7)",
            },
          ]
        : isThrow
          ? [
              {
                opacity: 0,
                transform: "translate(120px,-130px) rotate(-80deg) scale(.5)",
              },
              {
                opacity: 1,
                transform: "translate(-40px,-50px) rotate(25deg) scale(1)",
                offset: 0.4,
              },
              {
                opacity: 0,
                transform: "translate(-40px,-30px) rotate(40deg) scale(1.4,.3)",
              },
            ]
          : [
              {
                opacity: 0,
                transform: "translate(65px,-90px) rotate(-60deg) scale(1.2)",
              },
              {
                opacity: 1,
                transform: "translate(-20px,-50px) rotate(15deg) scale(1)",
                offset: 0.35,
              },
              {
                opacity: 0,
                transform: "translate(25px,-85px) rotate(-20deg) scale(.7)",
              },
            ];
  const mirror = (frames: Keyframe[], centerWeapon = false): Keyframe[] => frames.map(keyframe => ({
    ...keyframe,
    transform: String(keyframe.transform || "none")
      .replace(/translateX\((-?[\d.]+)px\)/g, (_, x) => `translateX(${-Number(x)}px)`)
      .replace(/translate\((-?[\d.]+)px,/g, (_, x) => `translate(${-Number(x) - (centerWeapon ? 105 : 0)}px,`)
      .replace(/rotate\((-?[\d.]+)deg\)/g, (_, angle) => `rotate(${-Number(angle)}deg)`),
  }));
  const side = direction === undefined ? undefined : direction < 0 ? -1 : 1;
  const bodySide = id === "pillow" || id === "slipper" ? -1 : 1;
  const weaponSide = isPunch ? 1 : -1;
  return {
    figure: side !== undefined && side !== bodySide ? mirror(figures[id]) : figures[id],
    weapon: side !== undefined && id !== "lightning" && side !== weaponSide ? mirror(weapon, true) : weapon,
    duration:
      (id === "banana"
        ? 650
        : id === "spring"
          ? 430
          : id === "pillow"
            ? 400
            : 360) * (space ? 1.5 : 1),
  };
}
