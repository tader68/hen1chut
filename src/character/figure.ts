import type { Mood } from './reaction'

const EYES: Record<Mood, string> = {
  normal: '<circle cx="85" cy="92" r="6"/><circle cx="115" cy="92" r="6"/>',
  ouch: '<path d="M78 88l14 8m0-8l-14 8" /><path d="M108 88l14 8m0-8l-14 8"/>',
  dizzy: '<path d="M85 92m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M85 92m-3 0a3 3 0 1 0 6 0" fill="none"/><path d="M115 92m-7 0a7 7 0 1 0 14 0a7 7 0 1 0-14 0M115 92m-3 0a3 3 0 1 0 6 0" fill="none"/>',
  knocked: '<path d="M78 92h14M108 92h14"/>',
}

const MOUTH: Record<Mood, string> = {
  normal: '<path d="M88 118q12 8 24 0" fill="none"/>',
  ouch: '<ellipse cx="100" cy="120" rx="8" ry="10"/>',
  dizzy: '<path d="M86 122q7-8 14 0t14 0" fill="none"/>',
  knocked: '<path d="M88 124q12-12 24 0" fill="none"/>',
}

export function renderFigure(name: string, mood: Mood): string {
  const stars =
    mood === 'knocked'
      ? '<g class="stars" fill="#f5c518" stroke="none"><text x="60" y="40" font-size="22">★</text><text x="100" y="30" font-size="22">★</text><text x="136" y="42" font-size="22">★</text></g>'
      : ''
  return `
<svg viewBox="0 0 200 320" class="figure" aria-label="${escapeAttr(name)}" role="img">
  <g stroke="#2b2b2b" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
    <rect x="62" y="150" width="76" height="100" rx="24" fill="#4a90d9"/>
    <rect x="68" y="244" width="24" height="56" rx="10" fill="#34495e"/>
    <rect x="108" y="244" width="24" height="56" rx="10" fill="#34495e"/>
    <rect x="34" y="160" width="26" height="70" rx="12" fill="#f2c6a0"/>
    <rect x="140" y="160" width="26" height="70" rx="12" fill="#f2c6a0"/>
    <circle cx="100" cy="100" r="52" fill="#f2c6a0"/>
    <path d="M52 86q10-44 48-44t48 44q-30-18-96 0z" fill="#3b2f2f"/>
    <g fill="#2b2b2b">${EYES[mood]}${MOUTH[mood]}</g>
    ${stars}
  </g>
</svg>`
}

function escapeAttr(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
