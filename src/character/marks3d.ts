import * as T from "three";
import type { Mark } from "./session";

export function createSurfaceMarks(head: T.Group, body: T.Group) {
  const headMarks = new T.Group(), bodyMarks = new T.Group(); head.add(headMarks); body.add(bodyMarks);
  const materials = new Map<string, T.SpriteMaterial>();
  let key = "";
  const materialFor = (mark: Mark) => {
    const id = `${mark.tool}:${mark.variant}`;
    if (materials.has(id)) return materials.get(id)!;
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
    const c = canvas.getContext("2d")!;
    c.translate(32, 32); c.rotate(mark.variant * .4); c.lineCap = "round"; c.lineJoin = "round";
    if (mark.tool === "tomato") {
      c.fillStyle = "#db7964"; c.beginPath();
      for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, r = i % 2 ? 17 : 24; if (!i) c.moveTo(Math.cos(a) * r, Math.sin(a) * r); else c.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
      c.closePath(); c.fill();
      c.fillStyle = "#f4b095"; c.beginPath(); c.ellipse(-4, -4, 9, 5, -.5, 0, Math.PI * 2); c.fill();
    } else if (mark.tool === "water") {
      c.fillStyle = "#82ccdf"; c.beginPath(); c.moveTo(0, -25); c.bezierCurveTo(-30, 14, -7, 31, 10, 16); c.bezierCurveTo(21, 6, 6, -13, 0, -25); c.fill();
      c.fillStyle = "#e6fcff"; c.beginPath(); c.ellipse(-5, 4, 3, 7, .3, 0, Math.PI * 2); c.fill();
    } else if (mark.tool === "pillow" || mark.tool === "chicken") {
      c.fillStyle = "#fff0ca"; c.beginPath(); c.ellipse(0, 0, 9, 24, .6, 0, Math.PI * 2); c.fill(); c.strokeStyle = "#d5b98c"; c.lineWidth = 2; c.beginPath(); c.moveTo(-13, 23); c.lineTo(9, -18); c.stroke();
    } else if (mark.tool === "confetti") {
      c.fillStyle = "#dc85b4"; c.fillRect(-18, -13, 10, 22); c.fillStyle = "#74b29b"; c.fillRect(4, -17, 19, 8); c.fillStyle = "#e3bc54"; c.fillRect(5, 7, 7, 18);
    } else if (mark.tool === "banana") {
      c.strokeStyle = "#e1b94e"; c.lineWidth = 9; c.beginPath(); c.moveTo(-20, -9); c.quadraticCurveTo(0, 26, 23, -13); c.stroke();
    } else {
      c.strokeStyle = "#74567d"; c.lineWidth = 4; c.beginPath(); c.moveTo(-18, -12); c.lineTo(18, 13); c.moveTo(-12, 18); c.lineTo(12, -20); c.moveTo(-21, 3); c.lineTo(22, -2); c.stroke();
    }
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
    const material = new T.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, opacity: .82 });
    materials.set(id, material); return material;
  };
  return {
    update(marks: Mark[]) {
      const next = JSON.stringify(marks); if (key === next) return; key = next;
      headMarks.clear(); bodyMarks.clear();
      for (const mark of marks) {
        const isHead = mark.y <= 205;
        const x = (mark.x - 150) / 150 * .73;
        const y = isHead ? Math.max(-.55, Math.min(.6, (140 - mark.y) / 90 * .6)) : (260 - mark.y) / 90;
        const surface = isHead
          ? .71 * Math.pow(Math.max(.1, 1 - Math.pow(Math.abs(x / .98), 2 / .77) - Math.pow(Math.abs(y / .78), 2 / .77)), .77 / 2)
          : .66 * Math.sqrt(Math.max(.2, 1 - x * x / .64));
        const sprite = new T.Sprite(materialFor(mark)); sprite.position.set(x, y, surface + (isHead ? .15 : .07)); sprite.scale.setScalar(.23);
        (isHead ? headMarks : bodyMarks).add(sprite);
      }
    },
    dispose() { headMarks.clear(); bodyMarks.clear(); materials.forEach(m => { m.map?.dispose(); m.dispose(); }); materials.clear(); },
  };
}
