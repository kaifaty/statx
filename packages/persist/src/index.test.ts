import {test} from 'uvu'
import {stateLocalStorage} from './persist.js'
import * as assert from 'uvu/assert'
import {PREFIX} from './consts.js'

const createStore = () => ({
  store: {} as Record<string, string>,
  getItem(name: string) {
    return this.store[name]
  },
  removeItem(name: string) {
    delete this.store[name]
  },
  setItem(name: string, value: string) {
    this.store[name] = value
  },
})

const getKey = (name: string) => {
  return PREFIX.localStorage + name
}
const getFromLocal = (name: string) => {
  try {
    return JSON.parse(localStorage.getItem(getKey(name))).value
  } catch {
    return
  }
}

//@ts-ignore
globalThis.localStorage = createStore()

test(`localstorage value can be set and read`, async () => {
  const name = 'test1'
  const value = 'testvalue'
  const state = stateLocalStorage('', {name, throttle: 0})

  state.set('testvalue')
  await 1

  assert.equal(getFromLocal(name), value)
})

test(`localstorage subscibe`, async () => {
  const name = 'test2'
  const value = 'testvalue'
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

test(`localstorage clear`, async () => {
  let test = 0
  const name = 'test3'
  const value = 'testvalue'
  const state = stateLocalStorage('', {name, throttle: 0})

  localStorage.setItem(getKey(name), value)
  state.clear()

  await new Promise((r) => setTimeout(r, 10))

  state.subscribe(() => {
    test++
  })
  state.set(value)

  await 1

  assert.equal(test, 1)
  state.set(value + '=')

  await 1
  assert.equal(test, 2)

  assert.equal(getFromLocal(name), value + '=')
})

test.run()
