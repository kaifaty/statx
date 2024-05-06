/* eslint-disable @typescript-eslint/no-explicit-any */
import './init-storages'
import {test} from 'uvu'
import {stateSessionStorage, stateLocalStorage} from '../persist.js'
import * as assert from 'uvu/assert'
import {getFromLocal, getKey, testAsyncStorage} from './init-storages.js'

test(`localStorage value can be set and read`, async () => {
  const name = 'test1'
  const value = 'testValue'
  const state = stateLocalStorage('', {name, throttle: 0})

  state.set('testValue')
  await 1

  assert.equal(getFromLocal(name), value)
})

test(`localStorage subscribe`, async () => {
  const name = 'test2'
  const value = 'testValue'
  const state = stateLocalStorage('', {name, throttle: 0})
  localStorage.setItem(getKey(name), value)
  let test = 0
  state.subscribe(() => {
    test = 1
  })
  state.set(value)
  await 1

  assert.equal(test, 1)
})

test(`localStorage clear`, async () => {
  let test = 0
  const name = 'test3'
  const value = 'testValue3'
  const state = stateLocalStorage('', {name, throttle: 0})

  localStorage.setItem(getKey(name), value)
  state.clear()

  await new Promise((r) => setTimeout(r, 10))

  state.subscribe(() => {
    test++
  })
  state.set(value)

  await 1

  assert.equal(test, 1, '1')
  state.set(value + '=')
  await new Promise((r) => setTimeout(r, 10))

  assert.equal(test, 2, '2')

  assert.equal(getFromLocal(name), value + '=', '3')
})

test('Custom class restore', async () => {
  class Test {
    constructor(private value: string) {}
    toJSON() {
      return {value: this.value}
    }
  }

  const state = stateLocalStorage([new Test('1'), new Test('2')], {
    name: 'array',
    throttle: 0,
    restoreFn: (data: {value: string}[]) => {
      return data.map((item) => new Test(item.value))
    },
  })
  assert.instance(state()[0], Test)

  state.set([new Test('1'), new Test('2'), new Test('2')])

  const state2 = stateLocalStorage([new Test('1')], {
    name: 'array',
    throttle: 0,
    restoreFn: (data: {value: string}[]) => {
      return data.map((item) => new Test(item.value))
    },
  })
  assert.instance(state2()[2], Test)
})

test('Function initialization', async () => {
  let i = 0
  const initializer = () => {
    i++
    return 'test'
  }
  const state = stateLocalStorage(initializer, {
    name: 'fn',
  })

  assert.is(state(), 'test')
  assert.is(i, 1)

  state.set('param')

  assert.is(state(), 'param')

  const state2 = stateLocalStorage(initializer, {
    name: 'fn',
  })
  assert.is(i, 1)

  assert.is(state2(), 'param')
})

test('Async adapter', async () => {
  const state = testAsyncStorage('qwe', {
    name: 'test',
  })
})

test('sessionStorage value can be set and read', async () => {
  const name = 'test4'
  const value = 'testValue'
  const state = stateSessionStorage('', {name, throttle: 0})

  state.set('testValue')
  await 1

  assert.equal(getFromLocal(name, true), value)
})

test.run()
