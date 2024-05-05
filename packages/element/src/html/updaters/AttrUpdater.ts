/* eslint-disable @typescript-eslint/no-explicit-any */
import {isStatxFn} from '@statx/core'
import {AttrTypes, createTextId} from '../utils'
import type {NodeUpdater} from './types'
import {getID} from './utils'

export class AttrUpdater implements NodeUpdater {
  private ownerElement: Element
  private attrType: number
  private attrBaseName: string
  private attrBaseValue: string
  private values: Record<string, unknown>
  private firstValue: unknown
  private unsubs?: Array<() => void>
  private target: Attr

  constructor(target: Attr, values: Array<unknown>) {
    if (!target.ownerElement) {
      throw new Error(`[Attribute error]: owner of ${target.name} is null`)
    }
    this.attrType = this.getAttrType(target)
    this.attrBaseName = this.getAttrBaseName(target)
    this.attrBaseValue = target.value
    this.ownerElement = target.ownerElement

    this.target = this.prepare(target)

    this.values = this.getTrackedValues(values)
    this.firstValue = Object.values(this.values)[0]

    Promise.resolve().then((r) => this.subscribe())
  }

  private getTrackedValues(values: Array<unknown>): Record<string, unknown> {
    const classList = this.attrBaseValue.split(' ')
    const newList = classList.reduce<Record<number, unknown>>((acc, item, i) => {
      const id = getID(item)
      const value = values[id]
      if (value !== undefined) {
        acc[id] = value
      }
      return acc
    }, {})
    return newList
  }

  private getAttrBaseName(target: Attr) {
    if (this.attrType > 0) {
      return target.name.substring(1)
    }
    return target.name
  }

  private getAttrType(target: Attr): number {
    const firstSymbol = target.name[0]
    if (firstSymbol === '?') {
      return 1
    }
    if (firstSymbol === '.') {
      return 2
    }
    if (firstSymbol === '@') {
      return 3
    }
    return 0
  }

  private prepare(target: Attr) {
    if (this.attrType > 0) {
      /**
       * Remove attr if to: boolean, property, handler
       */
      this.ownerElement.removeAttributeNode(target)
    }
    if (this.attrType === AttrTypes.BOOLEAN_ATTR) {
      target = document.createAttribute(this.attrBaseName)
      this.ownerElement.setAttributeNode(target)
    }
    return target
  }

  private setBooleanAttributes(value: boolean) {
    if (value) {
      this.target.value = ''
      if (this.target.ownerElement !== this.ownerElement) {
        this.ownerElement.setAttributeNode(this.target)
      }
    } else {
      if (this.target.ownerElement === this.ownerElement) {
        this.ownerElement.removeAttributeNode(this.target)
      }
    }
  }

  private setAttribute() {
    if (this.attrType === AttrTypes.BOOLEAN_ATTR) {
      this.setBooleanAttributes(Boolean(this.getSingleValue()))
    } else if (this.attrType === AttrTypes.ATTR) {
      const ids = Object.keys(this.values)
      let res = this.attrBaseValue

      for (const id of ids) {
        const value = this.values[id]
        res = res.replace(createTextId(id), String(isStatxFn(value) ? value.peek() : value))
      }

      this.target.value = res
    } else {
      console.error('[Error attribute set]: unknown attribute type')
    }
  }

  private getSingleValue() {
    return isStatxFn(this.firstValue) ? this.firstValue.peek() : this.firstValue
  }

  private setProperty() {
    //@ts-expect-error
    this.ownerElement[this.attrBaseName] = this.getSingleValue()
    // Устанавливать в State, а не заменять
  }

  private setHandler() {
    const value = this.getSingleValue()
    if (typeof value !== 'function') {
      console.error(`[Error]: Wrong handler name:${this.attrBaseName}. Value: ${value}`)
      return
    }
    this.ownerElement.addEventListener(this.attrBaseName, value as EventListener)
  }

  private update() {
    if (this.attrType === AttrTypes.PROPERTY) {
      this.setProperty()
    } else if (this.attrType === AttrTypes.HANDLER) {
      this.setHandler()
    } else {
      this.setAttribute()
    }
  }

  subscribe(): void {
    this.update()
    this.unsubs = Object.values(this.values)
      .map((item) => {
        if (isStatxFn(item)) {
          return item.subscribe(() => {
            this.update()
          })
        }
      })
      .filter(Boolean) as any
  }

  unSubscribe(): void {
    this.unsubs?.forEach((item) => item?.())
    this.unsubs = undefined
  }
}
