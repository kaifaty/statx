import {state} from '@statx/core'

export const statx = (_: any, ctx: ClassAccessorDecoratorContext) => {
  const {kind, name} = ctx
  if (kind !== 'accessor') {
    throw Error('Only field allowed')
  }
  if (typeof name === 'symbol') {
    throw Error('Smbol not allowed')
  }
  const valueState = state<any>(undefined)

  return {
    get() {
      return valueState()
    },

    set(val: any) {
      valueState.set(val)
    },

    init(initialValue: any) {
      valueState.set(initialValue)
      return initialValue
    },
  }
}
