import type {Common} from './index.js'

export function isStateType(value: unknown): value is Common<unknown> {
  return Boolean(value && typeof value === 'function' && '_internal' in value)
}
