import type {LitElement, PropertyValueMap} from 'lit'
import {AsyncDirective, directive} from 'lit/async-directive.js'
import {flushStates, startRecord, State, subscribe} from '@statx/core'
import type {CommonInternal, UnSubscribe} from '@statx/core'

import type {Computed} from '@statx/core'
import {noChange} from 'lit'

type Constructor<T> = new (...args: any[]) => T
type Subs = Set<CommonInternal>
type LitState = Computed<unknown> | State<unknown>

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

export const statableLit = <T extends Constructor<LitElement>>(superClass: T): T => {
  return class StatableLit extends superClass {
    private _subs: UnSubscribe[] = []
    private _prevSnapshot?: Subs
    private _unsubAll() {
      this._subs.forEach((unsub) => unsub())
      this._subs.length = 0
    }
    private _updater = () => this.requestUpdate()

    protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
      super.updated(_changedProperties)
      const data = flushStates()
      if (data && isEqual(data, this._prevSnapshot)) {
        return
      }
      this._prevSnapshot = data
      this._unsubAll()
      data?.forEach((state) => {
        this._subs.push(subscribe(state, this._updater))
      })
    }
    willUpdate(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
      super.willUpdate(_changedProperties)
      startRecord()
    }
    disconnectedCallback(): void {
      super.disconnectedCallback()
      this._unsubAll()
    }
  }
}

class ResolvePromise extends AsyncDirective {
  stateElement: LitState | undefined
  unsub: undefined | (() => void)
  reconnected() {
    this.subscribe()
  }
  disconnected() {
    this.unsub?.()
  }
  subscribe() {
    this.unsub = this.stateElement?.subscribe((v: unknown) => {
      this.setValue(v)
    })
  }

  render(stateElement: LitState) {
    if (this.stateElement !== stateElement) {
      this.unsub?.()
      this.stateElement = stateElement
      if (this.isConnected) {
        this.subscribe()
      }
    }

    return noChange
  }
}

export const litStateDirective = directive(ResolvePromise)
