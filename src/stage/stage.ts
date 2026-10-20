import { renderFigure } from '../character/figure'
import { applyHit, initialState, type ReactionState } from '../character/reaction'
import { Particles } from '../fx/particles'
import { hammer } from '../tools/hammer'

const NAME = 'Bạn nhỏ'

export function mountStage(root: HTMLElement): void {
  root.innerHTML = `
    <main class="stage" aria-label="Sân khấu">
      <header class="hud">
        <span>Đã xả: <strong id="count">0</strong></span>
        <button id="reset" type="button">Làm lại</button>
      </header>
      <div class="arena" id="arena">
        <div class="figure-wrap" id="figure"></div>
        <canvas id="fx" aria-hidden="true"></canvas>
      </div>
      <footer class="note">Nhân vật hoạt hình, chỉ để giải trí. Chạm vào nhân vật để dùng ${hammer.label}.</footer>
    </main>`

  const arena = root.querySelector<HTMLDivElement>('#arena')!
  const figure = root.querySelector<HTMLDivElement>('#figure')!
  const canvas = root.querySelector<HTMLCanvasElement>('#fx')!
  const count = root.querySelector<HTMLElement>('#count')!
  const resetBtn = root.querySelector<HTMLButtonElement>('#reset')!
  const particles = new Particles(canvas)
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)')

  let state: ReactionState = initialState()

  const resize = () => {
    const r = arena.getBoundingClientRect()
    const dpr = Math.min(devicePixelRatio || 1, 2)
    canvas.width = r.width * dpr
    canvas.height = r.height * dpr
    canvas.getContext('2d')!.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  new ResizeObserver(resize).observe(arena)

  const draw = () => {
    figure.innerHTML = renderFigure(NAME, state.mood)
    count.textContent = String(state.hits)
  }

  const squash = () => {
    if (reduceMotion.matches) return
    figure.getAnimations().forEach((a) => a.cancel())
    figure.animate(
      [
        { transform: 'scale(1,1) rotate(0)' },
        { transform: 'scale(1.18,0.78) rotate(-3deg)', offset: 0.25 },
        { transform: 'scale(0.92,1.1) rotate(2deg)', offset: 0.6 },
        { transform: 'scale(1,1) rotate(0)' },
      ],
      { duration: 220, easing: 'ease-out' },
    )
  }

  const popWord = (x: number, y: number) => {
    const el = document.createElement('div')
    el.className = 'pop'
    el.textContent = hammer.words[(Math.random() * hammer.words.length) | 0]
    el.style.left = `${x}px`
    el.style.top = `${y}px`
    arena.appendChild(el)
    el.addEventListener('animationend', () => el.remove(), { once: true })
    setTimeout(() => el.remove(), 900)
  }

  figure.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    const r = arena.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    state = applyHit(state, hammer.power)
    draw()
    squash()
    particles.burst(x, y)
    popWord(x, y)
  })

  resetBtn.addEventListener('click', () => {
    state = initialState()
    particles.clear()
    draw()
  })

  draw()
}
