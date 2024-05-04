/* eslint-disable @typescript-eslint/no-explicit-any */
import type {AnyFunc} from '../types'
import type {IAsync} from '../helpers/type'
import {nodesMap} from '../helpers/nodes-map'
import {cancelFrame, delay, startFrame} from './utils'

export function Start(this: IAsync) {
  this._isStarted = true
  this.customDeps.map((dep) => {
    nodesMap.addLink(dep, this, 'async dependency')
  })
  this.onDepsChange('start')
}

export function Stop(this: IAsync) {
  this._isStarted = false
  this.customDeps.map((dep) => {
    nodesMap.removeLinks(dep)
  })
}

export function IsMaxWait(this: IAsync) {
  if (this.maxWait) {
    return Date.now() - this._timeRequestStart > this.maxWait
  }
  return false
}

export function OnDepsChange(this: IAsync) {
  // Skip when stopped
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

  // TODO лишнее перевычисление когда значение computed не меняется
  this._frameId = startFrame(async () => {
    const controller = new AbortController()

    AbortControllerInit: {
      this._controller = controller
    }

    try {
      const isPendingBefore = this.isPending()
      if (!isPendingBefore) {
        //@ts-ignore
        this.isPending.set(true, 'start calc')
      }
      if (this.strategyDelay && isPendingBefore) {
        await delay(this.strategyDelay)
      }
      if (controller.signal.aborted) {
        return
      }

      const response = await this._fn(controller, this.prevValue)

      if (!controller.signal.aborted) {
        this._timeRequestStart = 0
        //@ts-ignore
        this.set(response, 'asyncCalc')
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
        //@ts-ignore
        this.isPending.set(false, 'finish calc')
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
  const unSub = this.subscribe((v) => {
    onFulfilled(v)
    unSub()
  })
}
