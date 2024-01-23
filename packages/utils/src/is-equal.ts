export const isEqualSet = (current: Set<unknown>, prev?: Set<unknown>) => {
  if (!prev) return false
  if (current.size !== prev.size) return false
  for (const state of prev) {
    if (!current.has(state)) {
      return false
    }
  }
  return true
}
