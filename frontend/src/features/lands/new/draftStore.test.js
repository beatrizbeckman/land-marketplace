import { describe, expect, it } from 'vitest'

import { squarePolygon } from '@/test/fixtures'

import { draftStore } from './draftStore'

const draft = {
  geometry: squarePolygon(0, 0),
  values: { price: '185,000', description: 'A nice flat land.', contact: 'a@b.co' },
}

describe('draftStore', () => {
  it('round-trips a draft through sessionStorage', () => {
    draftStore.save(draft)
    expect(draftStore.load()).toEqual(draft)
  })

  it('returns null when empty', () => {
    expect(draftStore.load()).toBeNull()
  })

  it('clears the stored draft', () => {
    draftStore.save(draft)
    draftStore.clear()
    expect(draftStore.load()).toBeNull()
  })

  it('survives corrupted payloads', () => {
    sessionStorage.setItem('landplot.draft', '{not json')
    expect(draftStore.load()).toBeNull()
  })
})
