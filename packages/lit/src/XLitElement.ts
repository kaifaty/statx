/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {LitElement} from 'lit'
import {computed, isComputed} from '@statx/core'
import {recorder} from '@statx/core'
import {isEqualSet} from '@statx/utils'
import type {CommonInternal, UnSubscribe} from '@statx/core'

export type Constructor<T> = new (...args: any[]) => T
type Subs = Set<CommonInternal>

interface BaseUpdatedElement extends HTMLElement {
  updated(..._args: any[]): void
  requestUpdate(..._args: any[]): void
  willUpdate(..._args: any[]): void
}

export const statable = <T extends Constructor<BaseUpdatedElement>>(superClass: T): T => {
  return class StatableLit extends superClass {
    private _subs: UnSubscribe[] = []
    private _prevSnapshot?: Subs
    private _unsubAll() {
      this._subs.forEach((unsub) => unsub())
      this._subs.length = 0
    }
    private _updater = () => this.requestUpdate()
    connectedCallback() {
      //@ts-ignore
      super.connectedCallback?.()
    }

    updated(...args: any[]): void {
      super.updated(args)
      const data = recorder.flush()

      if (data && isEqualSet(data, this._prevSnapshot)) {
        return
      }
      this._prevSnapshot = data
      this._unsubAll()

      data?.forEach((state) => {
        this._subs.push(state.subscribe(this._updater))
      })
    }
    willUpdate(...args: any[]): void {
      super.willUpdate(args)
      recorder.start()
    }
    disconnectedCallback(): void {
      //@ts-ignore
      super.disconnectedCallback?.()
      this._unsubAll()
    }
  }
}

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
