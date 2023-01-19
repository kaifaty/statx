import { test } from 'uvu'
import * as assert from 'uvu/assert'

import { state, computed, action } from './core'

const mockFn = () => {
  let calls = 0
  const mock = function () {
    calls++
  }
  mock.calls = () => calls
  return mock
}
/*
const v1 = state(10, 'v1')
const v2 = state(10, 'v2')
const v2_test = state<number>(10, 'v2')


const v3 = state(() => {
  console.log(v4.get())
  return v1.get() * v2.get()
}, 'v3')

const v4 = state(() => `Result value = ${v3.get()}`, 'v4')

for(let i = 0; i < 1000; i ++){
  v1.set(i)
}
*/

test('Defaul value', () => {
  assert.is(state(0)(), 0)
})

test('Name is settable', () => {
  assert.is(state(0, { name: 'name' }).name, 'name')
})

test('State may be reducer', () => {
  const v = state(0)
  const reducer = computed(() => v() + 10, { initial: 10 })

  v.set(1)
  v.set(2)
  v.set(3)
  v.set(10)

  assert.is(reducer(), 20)
})

test('Subscription of computable state', async () => {
  const fn = mockFn()
  const s1 = state(0)
  const s2 = state(2)
  const c2 = computed(() => s1() + 10)
  const c3 = computed(() => s1() + c2() + s2())

  let test = 0
  c3.subscribe(() => {
    test = c3()
    fn()
  })
  s1.set(10)
  s2.set(6)
  s2.set(1)
  s2.set(2)
  assert.is(test, 0)
  // after all mictotasks
  await 1
  assert.is(test, 10 + (10 + 10) + 2)
  assert.is(fn.calls(), 1)
})

test('Action', () => {
  const v1 = state(5)
  const v2 = state(4)
  const v3 = computed<number>(() => 1 + v2())

  const sum = action(() => {
    v2.set(100)
    v1.set(v1() + (v2() * 50) / v3())
  })

  assert.is(v1(), 5)
  assert.is(v2(), 4)
  assert.is(v3(), 4 + 1)

  sum.run()

  assert.is(v1(), 5 + (100 * 50) / 101)
})

/*
const seconds = state(0, 'name12')
const time = state(v => v + 1, 'name12', seconds.get())

seconds.set(v => v + 1)
seconds.set(v => v + 1)
seconds.set(v => v + 1)
seconds.set(v => v + 1)
seconds.set(v => v + 1)
seconds.set(v => v + 1)
console.log(seconds)

seconds.onUpdate = v => {
  console.log('updates seconds', v)
  throw new Error('=>>')
}
time.onUpdate = v => {
  console.log('updates time', v)
}

console.log(seconds.get())
seconds.subscribe(() => {
  console.log('on subscribe')
})
*/

test.run()
