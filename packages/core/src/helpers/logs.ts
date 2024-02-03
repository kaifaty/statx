import {nonce} from './nonce'
import type {CommonInternal} from './type'

type ValueListener = (base: CommonInternal) => void
type CommonListener = () => void

// TODO MINIFY

class Logs {
  private valueListeners: Array<ValueListener> = []
  private commonListeners: Array<CommonListener> = []
  private nodeCreate: Array<ValueListener> = []
  enabled = false

  setEnabled(value: boolean) {
    if (nonce.peek() > 0) {
      console.warn('SET LOGS ENABLE BEFORE ANY STATE OR COMPUTED BEEN CREATE')
    }
    this.enabled = value
  }
  logReason(node: CommonInternal, childNode: CommonInternal, level: number) {
    if (!this.enabled) {
      return
    }
    if (this.enabled) {
      if (level === 0) {
        childNode._reason = [node]
      } else if (childNode._reason) {
        childNode._reason.length = 0
      }
    }
  }

  dispatchValueUpdate(base: CommonInternal) {
    if (!this.enabled) {
      return
    }
    this.valueListeners.forEach((l) => l(base))
  }
  dispatchUpdate() {
    if (!this.enabled) {
      return
    }
    this.commonListeners.forEach((l) => l())
  }
  dispatchNodeCreate(node: CommonInternal) {
    if (!this.enabled) {
      return
    }
    this.nodeCreate.forEach((l) => l(node))
  }
  onUpdateValue(listener: ValueListener) {
    this.valueListeners.push(listener)
    return () => {
      this.valueListeners = this.valueListeners.filter((item) => item !== listener)
    }
  }
  onUpdate(listener: CommonListener) {
    this.commonListeners.push(listener)
    return () => {
      this.commonListeners = this.commonListeners.filter((item) => item !== listener)
    }
  }
  onNodeCreate(listener: CommonListener) {
    this.nodeCreate.push(listener)
    return () => {
      this.nodeCreate = this.nodeCreate.filter((item) => item !== listener)
    }
  }
}

export const logs = new Logs()
