interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  size: number
  color: string
}

const COLORS = ['#ffd23f', '#ff6b6b', '#4ecdc4', '#ffffff']

export class Particles {
  private list: Particle[] = []
  private raf = 0
  private ctx: CanvasRenderingContext2D
  private static readonly MAX = 150

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D not supported')
    this.ctx = ctx
  }

  burst(x: number, y: number, count = 14): void {
    for (let i = 0; i < count && this.list.length < Particles.MAX; i++) {
      const a = Math.random() * Math.PI * 2
      const s = 2 + Math.random() * 5
      this.list.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 2,
        life: 0,
        max: 24 + Math.random() * 18,
        size: 3 + Math.random() * 4,
        color: COLORS[(Math.random() * COLORS.length) | 0],
      })
    }
    if (!this.raf) this.raf = requestAnimationFrame(this.tick)
  }

  clear(): void {
    this.list = []
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private tick = (): void => {
    const { ctx, canvas } = this
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    this.list = this.list.filter((p) => p.life < p.max)
    for (const p of this.list) {
      p.life++
      p.vy += 0.35
      p.x += p.vx
      p.y += p.vy
      ctx.globalAlpha = 1 - p.life / p.max
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
    this.raf = this.list.length ? requestAnimationFrame(this.tick) : 0
  }
}
