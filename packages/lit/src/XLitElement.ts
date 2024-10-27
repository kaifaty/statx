/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type {PropertyValues} from 'lit'
import {LitElement} from 'lit'
import {recorder} from '@statx/core'
import {isEqualSet} from '@statx/utils'
import type {CommonInternal, UnSubscribe} from '@statx/core'

export type Constructor<T> = new (...args: any[]) => T
type Subs = Set<CommonInternal>

export class XLitElement extends LitElement {
  private _subs: UnSubscribe[] = []
  private _prevSnapshot?: Subs
  private _unsubAll() {
    this._subs.forEach((unsub) => unsub())
    this._subs.length = 0
  }
  private _updater = () => this.requestUpdate()

  updated(_changedProperties: PropertyValues): void {
    super.updated(_changedProperties)
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
  willUpdate(_changedProperties: PropertyValues): void {
    super.willUpdate(_changedProperties)
    recorder.start()
  }
  disconnectedCallback(): void {
    //@ts-ignore
    super.disconnectedCallback?.()
    this._unsubAll()
  }
}
