import { describe, expect, it } from 'vitest'
import { applyHit, initialState, moodFor } from './reaction'

describe('reaction', () => {
  it('starts normal with 0 hits', () => {
    expect(initialState()).toEqual({ hits: 0, mood: 'normal' })
  })

  it('moves through moods as hits grow', () => {
    expect(moodFor(0)).toBe('normal')
    expect(moodFor(1)).toBe('ouch')
    expect(moodFor(5)).toBe('ouch')
    expect(moodFor(6)).toBe('dizzy')
    expect(moodFor(13)).toBe('dizzy')
    expect(moodFor(14)).toBe('knocked')
  })

  it('applyHit increments and updates mood without mutating input', () => {
    const s0 = initialState()
    const s1 = applyHit(s0)
    expect(s1).toEqual({ hits: 1, mood: 'ouch' })
    expect(s0.hits).toBe(0)
  })

  it('power is at least 1 and floored', () => {
    expect(applyHit(initialState(), 0).hits).toBe(1)
    expect(applyHit(initialState(), 2.9).hits).toBe(2)
  })
})
