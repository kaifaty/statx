/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {computed, state} from './nodes'

type Constructor = {
  constructor: Function
}

export const makeAutoObservable = <T extends Constructor>(Class: T) => {
  const properties = Object.getOwnPropertyNames(Class)
  const className = Class.constructor.name

  properties.forEach((propName) => {
    const value = (Class as any)[propName as any]
    if (typeof value !== 'function' && typeof value !== 'symbol') {
      const stateValue = state(value, {
        name: className + '.' + propName,
      })
      Object.defineProperty(Class, propName, {
        get: stateValue,
        set(value) {
          stateValue.set(value)
        },
      })
    }
  })

  const prototype = Class.constructor.prototype
  const classFields = Object.getOwnPropertyNames(prototype)

  classFields.forEach((name) => {
    if (name === 'constructor') {
      return
    }
    const d = Object.getOwnPropertyDescriptor(prototype, name)
    const get = d?.get
    if (get) {
      const computedValue = computed(get.bind(Class), {
        name: className + '.' + name,
      })
      Object.defineProperty(Class, name, {
        get: computedValue,
        set: d?.set,
      })
    }
  })
}
