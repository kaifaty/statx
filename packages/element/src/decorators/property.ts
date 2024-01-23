/* eslint-disable @typescript-eslint/no-explicit-any */
import {ElementX} from '../x-element'
import type {Properties, PropertyData} from '../types'

export const attributes = new WeakMap<any, Array<string>>()

const addProperty = (ctx: ClassAccessorDecoratorContext) => {
  const data = attributes.get(ctx.metadata) ?? []
  data.push(ctx.name as string)
  attributes.set(ctx.metadata, data)
}

export const property = (params: PropertyData) => (value: any, ctx: ClassAccessorDecoratorContext) => {
  const {addInitializer, kind, name} = ctx
  if (kind !== 'accessor') {
    throw Error('Only accessor allowed')
  }
  if (typeof name === 'symbol') {
    throw Error('Symbol not allowed')
  }
  addProperty(ctx)
  addInitializer(function () {
    const classInstance = this as ElementX
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

      const classInstance = this as any as ElementX

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
