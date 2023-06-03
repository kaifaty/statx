import {test} from 'uvu'
import * as assert from 'uvu/assert'

import {throttle} from './index.js'

test(`immidate call`, async () => {
  let value = 0
  const func = throttle(() => {
    value = 1
  }, 10)
  func()
  assert.is(value, 1)
})

test(`throttle call`, async () => {
  let value = 0
  const func = throttle(() => {
    value++
  }, 10)
  func()
  assert.is(value, 1)
  func()
  assert.is(value, 1)
  await new Promise((r) => setTimeout(r, 20))
  assert.is(value, 2)
  func()
  assert.is(value, 3)
})

test(`return value`, async () => {
  let value = 0
  const func = throttle(() => {
    return ++value
  }, 10)
  const v = await func()
  assert.is(v, 1)

  const v1 = await func()
  assert.is(v1, 2)

  const v2 = await func()
  assert.is(v2, 3)

  await Promise.all([func(), func(), func(), func(), func(), func(), func(), func(), func()])
  assert.is(value, 4)
})

test.run()
