/* eslint-disable @typescript-eslint/no-explicit-any */
import type {AnyFunc} from '../types'
import type {IAsync} from './type'

const cancelFrame = globalThis.cancelAnimationFrame ?? clearTimeout
const startFrame = globalThis.requestAnimationFrame ?? setTimeout

export function Start(this: IAsync) {
  this._isStarted = true
  this.customDeps.map((dep) => {
    // TODO
    //dep._listeners.add(this)
  })
  this.onDepsChange()
}

export function Stop(this: IAsync) {
  this._isStarted = false
  this.customDeps.map((dep) => {
    // TODO
    //dep._listeners.delete(this)
  })
}

export function IsMaxWait(this: IAsync) {
  if (this.maxWait) {
    return Date.now() - this._timeRequestStart > this.maxWait
  }
  return false
}

export function OnDepsChange(this: IAsync) {
  // Skip when stoped
  if (!this._isStarted) {
    return
  }
  if (!this._timeRequestStart) {
    this._timeRequestStart = Date.now()
  }

  if (this.strategy === 'last-win' && !this.isMaxWait() && this.isPending()) {
    this._controller?.abort('[NEW_CALL]: last-win strategy')
  }

  cancelFrame(this._frameId)

  this._frameId = startFrame(async () => {
    const controller = new AbortController()

    AbortControllerIniting: {
      const prevState = this.currentValue
      this._controller = controller

      controller.signal.onabort = () => {
        this.set(prevState)
      }
    }

    try {
      this.isPending.set(true)
      const response = await this._fn(controller)

      if (!controller.signal.aborted) {
        this._timeRequestStart = 0
        this.set(response)
        this.error.set(undefined)
      }
    } catch (e) {
      if (controller.signal.aborted) {
        this.error.set(e as Error)

        if (this.undefinedOnError) {
          this.set(undefined)
        }
      }
    } finally {
      if (!controller.signal.aborted) {
        this.isPending.set(false)
        this._timeRequestStart = Date.now()
      }
    }
  })
}

/**
 * Make possible to write `await asyncState and get value after load`
 */
export function Then(this: IAsync, onFulfilled: AnyFunc) {
  const isLoading = this.isPending()

  if (!isLoading && this.currentValue !== undefined) {
    return onFulfilled(this.currentValue)
  }

  //@ts-ignore
  const unsub = this.subscribe((v) => {
    onFulfilled(v)
    unsub()
  })
}
