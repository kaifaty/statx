/* eslint-disable @typescript-eslint/no-explicit-any */
import {LitElement} from 'lit'
import {computed, isComputed} from '@statx/core'

export class XLitElement extends LitElement {
  private _unsub?: () => void
  private _replaceRender() {
    if (isComputed(this.render)) {
      return
    }
    const currentRender = this.render.bind(this)
    const computedRender = computed(currentRender, {name: `${this.constructor.name}.render`})

    this._unsub = computedRender.subscribe(() => {
      this.requestUpdate()
    })

    Object.defineProperty(this, 'render', {
      value: computedRender,
    })
  }
  connectedCallback(): void {
    super.connectedCallback()
    this._replaceRender()
  }
  disconnectedCallback(): void {
    this._unsub?.()
  }
}
