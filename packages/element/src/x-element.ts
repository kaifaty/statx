import {withMachine} from '@statx/machine'

/* eslint-disable @typescript-eslint/no-explicit-any */
import {render} from 'lit/html.js'
import {adoptToElement, type WCStyleSheet} from './styles'
import type {Properties} from './types'
import {attrToBoolean} from './utils'

const attributes = new WeakMap<any, Array<string>>()

export const addProperty = (ctx: ClassAccessorDecoratorContext) => {
  const data = attributes.get(ctx.metadata) ?? []
  data.push(ctx.name as string)
  attributes.set(ctx.metadata, data)
}

export abstract class IXElement extends HTMLElement {
  static properties: Properties
}

const req = Symbol()
const renderTo = Symbol()

class BaseElement extends IXElement {
  static styles: WCStyleSheet
  static properties = {}
  static get observedAttributes() {
    return attributes.get((this as any)[Symbol.metadata]) ?? []
  }
  [req] = 0;
  [renderTo]() {
    this.willUpdate()
    render(this.render(), this.createRenderRoot())
    this.updated()
  }
  get cnstr() {
    return this.constructor as any
  }
  constructor() {
    super()
    this.attachShadow({mode: 'open'})
    if (this.cnstr.styles) {
      adoptToElement(this, this.cnstr.styles)
    }
  }
  connectedCallback() {
    this[renderTo]()
  }
  requestUpdate(): void {
    this[req] = requestAnimationFrame(() => this[renderTo]())
  }
  createRenderRoot() {
    return this.shadowRoot as ShadowRoot
  }
  willUpdate(): void {}
  updated(): void {}
  render(): unknown {
    return ''
  }
  attributeChangedCallback(name: string, old: string | null, value: string | null) {
    if (old === value) {
      return
    }
    const type = this.props[name]?.type
    if (type === Boolean) {
      if (typeof value === 'string' && value !== '') {
        this.setAttribute(name, '')
        return
      }
      ;(this as any)[name] = attrToBoolean(value)
    } else if (type === String) {
      ;(this as any)[name] = String(value ?? '')
    }
  }
  get props(): Properties {
    return (this.constructor as any).properties
  }
}

export class XElement extends withMachine(BaseElement) {}
