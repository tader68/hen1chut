export type Mood = 'normal' | 'ouch' | 'dizzy' | 'knocked'

export interface ReactionState {
  hits: number
  mood: Mood
}

export const MOOD_THRESHOLDS = { ouch: 1, dizzy: 6, knocked: 14 } as const

export function moodFor(hits: number): Mood {
  if (hits >= MOOD_THRESHOLDS.knocked) return 'knocked'
  if (hits >= MOOD_THRESHOLDS.dizzy) return 'dizzy'
  if (hits >= MOOD_THRESHOLDS.ouch) return 'ouch'
  return 'normal'
}

export function initialState(): ReactionState {
  return { hits: 0, mood: 'normal' }
}

export function applyHit(state: ReactionState, power = 1): ReactionState {
  const hits = state.hits + Math.max(1, Math.floor(power))
  return { hits, mood: moodFor(hits) }
}
