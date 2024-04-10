/* eslint-disable @typescript-eslint/no-explicit-any */
import {makeObservable} from './make-observable'

class ServiceInfo {
  private _status = 'open'

  constructor() {
    makeObservable(this)
  }
  set status(value: string) {
    this._status = value
  }
  get isOpen() {
    return this.status === 'open'
  }
  setStatus(value: string) {
    this.status = value
  }
}
const service = new ServiceInfo()
const service2 = new ServiceInfo()
