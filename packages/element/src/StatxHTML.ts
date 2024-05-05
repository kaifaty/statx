/* eslint-disable @typescript-eslint/no-explicit-any */
import {isStatxFn, isState, computed, state, isComputed} from '@statx/core'
import {HTMLResult, render} from './html'
import type {WCStyleSheet} from './styles'

import {adoptToElement} from './styles'
import type {ObservedAttributeMap} from './types'

const renderTo = Symbol()
const bindMethods = Symbol()
const applyStyles = Symbol()
const replaceRender = Symbol()
const createAttributeWatchers = Symbol()

export class StatxHTML extends HTMLElement {
  static styles: WCStyleSheet
  static attributes: ObservedAttributeMap

  private root: HTMLElement | ShadowRoot
  private htmlResult?: HTMLResult
  private unsubs: Array<() => void> = []

  static get observedAttributes() {
    return Object.keys(this.attributes)
  }

  constructor() {
    super()
    this.attachShadow({mode: 'open'})
    this.root = this.createRenderRoot()
    this[bindMethods]()
    this[applyStyles]()
  }

  attributeChangedCallback(name: string, _: string | null, value: string | null) {
    //@ts-expect-error
    const prop = this[name]
    if (isState(prop)) {
      //@ts-expect-error
      const attributes = this.constructor.attributes as ObservedAttributeMap
      prop.set(attributes[name].converter?.fromAttribute?.(value) ?? value)
    }
  }

  private [createAttributeWatchers]() {
    //@ts-expect-error
    const attributes = this.constructor.attributes as ObservedAttributeMap

    for (const attrName of Object.keys(attributes)) {
      const attrParams = attributes[attrName]

      //@ts-expect-error
      const existProp = this[attrName]
      if (existProp) {
        if (!isStatxFn(existProp)) {
          console.error(`[Error to set attribute state]: Prop ${attrName} is exist`, existProp)
        }
      } else {
        Object.defineProperty(this, attrName, {
          value: state(undefined, {name: `${this.constructor.name}.${attrName}`}),
        })
      }
      //@ts-expect-error
      const prop = this[attrName]

      if (isState(prop)) {
        prop.set(this.getAttribute(attrName))
        if (attrParams.reflect) {
          this.unsubs.push(
            prop.subscribe((v) => {
              this.setAttribute(attrName, attrParams.converter?.toAttribute?.(v) ?? String(v))
            }),
          )
        }
      }
    }
  }
  private [applyStyles]() {
    //@ts-expect-error
    const styles = this.constructor.styles as WCStyleSheet
    if (styles) {
      adoptToElement(this, styles)
    }
  }
  private [bindMethods]() {
    Object.getOwnPropertyNames(this.constructor.prototype).forEach((fnName) => {
      if (fnName !== 'constructor' && fnName !== 'render') {
        Object.defineProperty(this, fnName, {
          value: this.constructor.prototype[fnName].bind(this),
        })
      }
    })
  }
  private [replaceRender]() {
    if (isComputed(this.render)) {
      return
    }
    const currentRender = this.render.bind(this)
    const computedRender = computed(currentRender, {name: `${this.constructor.name}.render`})

    this.unsubs.push(
      computedRender.subscribeState(() => {
        this[renderTo]()
      }),
    )
    Object.defineProperty(this, 'render', {
      value: computedRender,
    })
  }
  private [renderTo]() {
    this.htmlResult?.dispose()
    this.htmlResult = undefined
    this.willRender()

    const content = this.render()
    if (content instanceof HTMLResult) {
      this.htmlResult = content
    }
    render(content, this.root)

    this.rendered()
  }

  createRenderRoot(): HTMLElement | ShadowRoot {
    return this.shadowRoot as ShadowRoot
  }

  connectedCallback() {
    this[createAttributeWatchers]()
    this[replaceRender]()
    this[renderTo]()
  }

  disconnectedCallback() {
    this.htmlResult?.dispose()
    this.unsubs.forEach((item) => item())
  }

  willRender(): void {}
  rendered(): void {}
  render(): unknown | undefined | null {
    return undefined
  }
}
