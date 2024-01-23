/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {flushStates, startRecord} from '@statx/core'
import {isEqualSet} from '@statx/utils'
import type {CommonInternal, UnSubscribe} from '@statx/core'
import {Constructor} from '../types'

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
      //@ts-ignore
      const name = customElements.getName?.(this.constructor) ?? this.constructor.name
      //@ts-ignore
      this._updater.subscriber = name
    }

    updated(...args: any[]): void {
      super.updated(args)
      const data = flushStates()
      if (data && isEqualSet(data, this._prevSnapshot)) {
        return
      }
      this._prevSnapshot = data
      this._unsubAll()
      data?.forEach((state) => {
        this._subs.push(state.subscribe(this._updater as any))
      })
    }
    willUpdate(...args: any[]): void {
      super.willUpdate(args)
      startRecord()
    }
    disconnectedCallback(): void {
      //@ts-ignore
      super.disconnectedCallback?.()
      this._unsubAll()
    }
  }
}
