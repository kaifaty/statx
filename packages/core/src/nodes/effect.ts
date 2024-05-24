/* eslint-disable @typescript-eslint/no-explicit-any */
import {nonce} from '../helpers'
import {assert, getNewFnWithName, isFunction} from '../helpers/utils'
import {computed} from './computed'
import {
  Deactivate,
  EffectActivate,
  type DepsFn,
  type EffectFn,
  type EffectInner,
  type EffectScheduler,
} from './proto-effect'

export type EffectOptions = {
  activateOnCreate?: boolean
  fireOnActivate?: boolean
  scheduler?: EffectScheduler
  name?: string
}

export type Effect = {
  activate(): void
  deactivate(): void
  name: string
}

const EffectProto: Effect = Object.create(null)

EffectProto.activate = EffectActivate
EffectProto.deactivate = Deactivate

export const effect = <T extends DepsFn>(depsFn: T, fn: EffectFn<T>, options?: EffectOptions): Effect => {
  assert(!isFunction(depsFn), 'depsFn must be function')
  assert(!isFunction(fn), 'fn must be function')

  const id = nonce.get()
  const Effect: EffectInner = getNewFnWithName(options, 'effect_' + id)

  Object.setPrototypeOf(Effect, EffectProto)

  Effect.computedDeps = computed(depsFn, {name: 'effect_computed_deps_' + id})
  Effect.fn = fn as any

  initOptions: {
    Effect.activateOnCreate = Number(options?.activateOnCreate ?? 0)
    Effect.fireOnActivate = Number(options?.fireOnActivate ?? 1)
  }

  if (Effect.activateOnCreate) {
    Effect.activate()
  }

  return Effect as any as Effect
}
