/* eslint-disable @typescript-eslint/no-explicit-any */

import {makeAutoObservable} from './make-auto-observable'
import {effect} from './nodes'

class ServiceInfo {
  private _status = 'open'
  i = 0
  constructor() {
    makeAutoObservable(this)
  }
  get status() {
    return this._status
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

setInterval(() => {
  service.status = Date.now().toString()
  service.i++
}, 1000)

const eff = effect(
  () => {
    if (service.i < 3) {
      return service.isOpen
    }
    return {кусь: 3, status: service.status}
  },
  (d) => {
    console.log(service.status, d)
  },
  {
    activateOnCreate: true,
    fireOnActivate: true,
  },
)
