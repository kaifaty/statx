export const cancelFrame = globalThis.cancelAnimationFrame ?? clearTimeout
export const startFrame = globalThis.requestAnimationFrame ?? setTimeout
export const delay = (t: number) => new Promise((r) => setTimeout(r, t))
