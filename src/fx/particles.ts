import type { ToolId } from "../tools/registry";
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  angle: number;
  type: ToolId;
}
export class Particles {
  private list: Particle[] = [];
  private raf = 0;
  private last = 0;
  private ctx: CanvasRenderingContext2D;
  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D not supported");
    this.ctx = ctx;
  }
  burst(x: number, y: number, type: ToolId, gentle = false): void {
    const palette: Record<ToolId, string[]> = {
      hammer: ["#c6a5ee", "#fff3b8", "#fff"],
      pillow: ["#fffaf0", "#f2ddb5", "#fff"],
      tomato: ["#ef8e79", "#df6b62", "#f3b39b"],
      water: ["#b1e2f5", "#77bfdc", "#e6faff"],
      boot: ["#ecc27f", "#fff2cb", "#fff"],
      lightning: ["#ffe599", "#f7ca5d", "#fff5d3"],
      boxing: ["#f1b0b8", "#fff1ba", "#fff"],
      spring: ["#a8cfb8", "#d9e9cd", "#fff"],
      slipper: ["#87b7a7", "#d7e9cc", "#fff"],
      chicken: ["#f1d894", "#fff1ca", "#e8a18d"],
      banana: ["#e9ce67", "#fff2ac", "#fff"],
      confetti: ["#c7a1df", "#f1bcce", "#9dcdbb"],
    };
    for (let i = 0; i < (gentle ? 6 : 26) && this.list.length < 160; i++) {
      const angle = Math.random() * Math.PI * 2,
        speed = gentle ? 28 : 70 + Math.random() * 200;
      this.list.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 70,
        life: 0,
        max: 0.45 + Math.random() * 0.45,
        size: 3 + Math.random() * 7,
        color: palette[type][i % 3],
        angle,
        type,
      });
    }
    if (!this.raf) {
      this.last = 0;
      this.raf = requestAnimationFrame(this.tick);
    }
  }
  clear(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.list = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
  private tick = (time: number): void => {
    const dt = this.last ? Math.min((time - this.last) / 1000, 0.04) : 1 / 60;
    this.last = time;
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.list = this.list.filter((p) => p.life < p.max);
    for (const p of this.list) {
      p.life += dt;
      p.vy += 260 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle + p.life * 3);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.type === "hammer" || p.type === "lightning" || p.type === "boot") {
        for (let n = 0; n < 10; n++) {
          const a = (n * Math.PI) / 5,
            r = n % 2 ? p.size * 0.4 : p.size;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
      } else if (p.type === "pillow")
        ctx.ellipse(0, 0, p.size, p.size * 0.3, 0, 0, Math.PI * 2);
      else ctx.ellipse(0, 0, p.size * 0.65, p.size, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    this.raf = this.list.length ? requestAnimationFrame(this.tick) : 0;
  };
}
