import {makeAutoObservable} from '../make-auto-observable'

/* eslint-disable @typescript-eslint/no-explicit-any */
import {test} from 'uvu'
import * as assert from 'uvu/assert'

class ServiceInfo {
  private _status = 'open'

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

test('test fields', () => {
  const serviceInfo = new ServiceInfo()

  assert.is(serviceInfo.isOpen, true, '1')

  serviceInfo.setStatus('closed')

  assert.is(serviceInfo.status, 'closed', '2')
  assert.is(serviceInfo.isOpen, false, '3')
})

test('test fields 2', () => {
  const serviceInfo = new ServiceInfo()
  const serviceInfo2 = new ServiceInfo()

  assert.is(serviceInfo.isOpen, true, '1')

  serviceInfo.setStatus('closed')

  assert.is(serviceInfo.status, 'closed', '2')
  assert.is(serviceInfo.isOpen, false, '3')
  assert.is(serviceInfo2.isOpen, true, '4')
})

test('check cache', () => {
  let i = 0
  class Check {
    test = 10
    constructor() {
      makeAutoObservable(this)
    }
    get calc() {
      i++
      return this.test ** 20
    }
  }
  const check = new Check()

  assert.is(i, 0, '0')
  assert.is(check.calc, 10 ** 20, '1')
  assert.is(i, 1, '2')
  assert.is(check.calc, 10 ** 20, '3')
  assert.is(check.calc, 10 ** 20, '3')
  assert.is(i, 1, '4')

  check.test = 20
  assert.is(check.calc, 20 ** 20, '5')
  assert.is(check.calc, 20 ** 20, '5')
  assert.is(i, 2, '6')
})

test.run()
