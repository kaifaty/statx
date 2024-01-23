import {AsyncDirective, directive} from 'lit/async-directive.js'
import type {UnSubscribe} from '@statx/core'

import type {PublicState} from '@statx/core'
import {noChange} from 'lit'

class ResolvePromise extends AsyncDirective {
  private stateElement: PublicState<unknown> | undefined
  private unsub: UnSubscribe | undefined
  reconnected() {
    if (this.stateElement) {
      this.setValue(this.stateElement())
      this.subscribe()
    }
  }
  disconnected() {
    cancelAnimationFrame(this.req)
    this.unsub?.()
  }
  private req = 0
  private requestUpdate(value: unknown) {
    cancelAnimationFrame(this.req)
    this.req = requestAnimationFrame(() => {
      this.setValue(value)
    })
  }
  private subscribe() {
    this.unsub = this.stateElement?.subscribe((v: unknown) => {
      this.requestUpdate(v)
    })
  }

  render(stateElement: PublicState<unknown>) {
    if (this.stateElement !== stateElement) {
      this.unsub?.()
      cancelAnimationFrame(this.req)
      this.stateElement = stateElement
      if (this.isConnected) {
        this.subscribe()
        this.setValue(stateElement())
      }
    }

    return noChange
  }
}

export const watch = directive(ResolvePromise)
