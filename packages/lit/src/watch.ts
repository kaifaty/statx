import {AsyncDirective, directive} from 'lit/async-directive.js'
import type {UnSubscribe} from '@statx/core'

import type {Common} from '@statx/core'
import {noChange} from 'lit'

type LitState = Common<unknown>

class ResolvePromise extends AsyncDirective {
  stateElement: LitState | undefined
  unsub: UnSubscribe | undefined
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

export const watch = directive(ResolvePromise)
