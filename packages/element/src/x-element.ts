/* eslint-disable @typescript-eslint/no-explicit-any */
import {render} from 'lit/html.js'
import {adoptToElement, type WCStyleSheet} from './styles'
import type {Properties} from './types'
import {attrToBoolean} from './utils'
import {statable} from './mixins/statable'
import {attributes} from './decorators/property'

//@ts-ignore
if (!Symbol.metadata) {
  //@ts-ignore
  Symbol.metadata = Symbol()
}

const req = Symbol()
const renderTo = Symbol()

class BaseElement extends HTMLElement {
  static styles: WCStyleSheet
  static properties: Properties = {}
  static get observedAttributes() {
    //@ts-ignore
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
  disconnectedCallback() {}
  requestUpdate(): void {
    if (this[req]) {
      return
    }
    this[req] = requestAnimationFrame(() => {
      this[renderTo]()
      this[req] = 0
    })
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

export class ElementX extends statable(BaseElement) {}
