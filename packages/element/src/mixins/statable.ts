/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {flushStates, startRecord} from '@statx/core'
import type {CommonInternal, UnSubscribe} from '@statx/core'

type Constructor<T> = new (...args: any[]) => T
type Subs = Set<CommonInternal>

interface BaseUpdatedElement extends HTMLElement {
  updated(..._args: any[]): void
  requestUpdate(..._args: any[]): void
  willUpdate(..._args: any[]): void
}

const isEqual = (current: Subs, prev?: Subs) => {
  if (!prev) return false
  if (current.size !== prev.size) return false
  for (const state of prev) {
    if (!current.has(state)) {
      return false
    }
  }
  return true
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

    updated(...args: any[]): void {
      super.updated(args)
      const data = flushStates()
      if (data && isEqual(data, this._prevSnapshot)) {
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
      startRecord()
    }
    disconnectedCallback(): void {
      //@ts-ignore
      super.disconnectedCallback?.()
      this._unsubAll()
    }
  }
}
