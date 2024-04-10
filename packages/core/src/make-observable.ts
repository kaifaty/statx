/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {computed, state} from './nodes'

type Constructor = {
  constructor: Function
}

export const makeObservable = <T extends Constructor>(data: T) => {
  const properties = Object.getOwnPropertyNames(data)
  const className = data.constructor.name

  properties.forEach((propName) => {
    const value = (data as any)[propName as any]
    if (typeof value !== 'function' && typeof value !== 'symbol') {
      const stateValue = state(value, {
        name: className + '.' + propName,
      })
      Object.defineProperty(data, propName, {
        get: stateValue,
        set(value) {
          stateValue.set(value)
        },
      })
    }
  })

  const prototype = data.constructor.prototype
  const classFields = Object.getOwnPropertyNames(prototype)

  if (prototype.__isInited__) {
    return
  }
  classFields.forEach((name) => {
    if (name === 'constructor') {
      return
    }
    const d = Object.getOwnPropertyDescriptor(prototype, name)
    const get = d?.get
    if (get) {
      const computedValue = computed(get, {
        name: className + '.' + name,
      })
      Object.defineProperty(prototype, name, {
        get: computedValue,
      })
    }
  })
  prototype.__isInited__ = true
}
