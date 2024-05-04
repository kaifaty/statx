/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Computed} from '../types'

export type DepsFn = () => unknown

export type EffectFn<T extends DepsFn> = (value: ReturnType<T>) => void

export type EffectScheduler = (run: EffectFn<DepsFn>) => void

export type EffectInner = {
  // Options
  activateOnCreate: number
  fireOnActivate: number
  scheduler?: EffectScheduler

  name: string
  sub?: () => void
  fn: (value: unknown) => void
  activate(): void
  deactivate(): void
  computedDeps: Computed<unknown>
}

const execute = (effect: EffectInner, value: unknown) => {
  if (effect.scheduler) {
    effect.scheduler(() => effect.fn(value))
  } else {
    effect.fn(value)
  }
}

export function EffectActivate(this: EffectInner) {
  this.sub = this.computedDeps.subscribe((dep) => {
    execute(this, dep)
  })
  if (this.fireOnActivate) {
    execute(this, this.computedDeps())
  }
}

export function Deactivate(this: EffectInner) {
  this.sub?.()
  delete this.sub
}
