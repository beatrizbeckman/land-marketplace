const DRAFT_KEY = 'landplot.draft'

export const draftStore = {
  save(draft) {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  },
  load() {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  },
  clear() {
    sessionStorage.removeItem(DRAFT_KEY)
  },
}
