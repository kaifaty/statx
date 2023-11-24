/* eslint-disable @typescript-eslint/no-explicit-any */
import {XElement, addProperty} from '../x-element'
import type {Properties, PropertyData} from '../types'

if (!Symbol.metadata) {
  //@ts-ignore
  Symbol.metadata = Symbol()
}

export const property = (params: PropertyData) => (value: any, ctx: ClassAccessorDecoratorContext) => {
  const {addInitializer, kind, name} = ctx
  if (kind !== 'accessor') {
    throw Error('Only field allowed')
  }
  if (typeof name === 'symbol') {
    throw Error('Smbol not allowed')
  }
  addProperty(ctx)
  addInitializer(function () {
    const classInstance = this as XElement
    const properties: Properties = (classInstance.constructor as any).properties

    properties[name] = params
  })

  const {get, set} = value

  return {
    get() {
      console.log(`getting ${name}`)

      return get.call(this)
    },

    set(val: any) {
      console.log(`setting ${name} to ${val}`)

      const classInstance = this as any as XElement

      if (params.reflect) {
        if (params.type === Boolean) {
          val ? classInstance.setAttribute(name, '') : classInstance.removeAttribute(name)
        } else if (params.type === String) {
          classInstance.setAttribute(name, value)
        }
      }
      params.onChange?.(classInstance, val)

      return set.call(this, val)
    },

    init(initialValue: any) {
      console.log(`initializing ${name} with value ${initialValue}`)
      return initialValue
    },
  }
}
