/* eslint-disable @typescript-eslint/no-explicit-any */
import {delay} from '../nodes/utils'
import {effect, state} from '../nodes'
import {test} from 'uvu'
import * as assert from 'uvu/assert'

test('test effect', async () => {
  const st = state(0)
  let i = 0
  const ef = effect(
    () => st(),
    () => {
      i++
    },
    {
      activateOnCreate: false,
      fireOnActivate: false,
    },
  )

  assert.is(i, 0, 'no changes')

  await delay(10)
  assert.is(i, 0, 'no changes if not active')

  ef.activate()
  await delay(10)

  assert.is(i, 0, 'no changes if not immediate run')

  st.set(10)
  assert.is(i, 0, 'will change after raf')

  await delay(10)
  assert.is(i, 1, 'must be change')
})

test('activate on create - on', async () => {
  const st = state(0)
  let i = 0
  effect(
    () => st(),
    () => {
      i++
    },
    {fireOnActivate: false, activateOnCreate: true},
  )
  assert.is(i, 0, 'no changes')
  st.set(10)
  await delay(10)
  assert.is(i, 1, 'has update')
})

test('activate on create - off', async () => {
  const st = state(0)
  let i = 0
  effect(
    () => st(),
    () => {
      i++
    },
    {fireOnActivate: false, activateOnCreate: false},
  )
  assert.is(i, 0, 'no changes')
  st.set(10)
  await delay(10)
  assert.is(i, 0, 'no update')
})

test('activate on create - default off', async () => {
  const st = state(0)
  let i = 0
  effect(
    () => st(),
    () => {
      i++
    },
    {fireOnActivate: false},
  )
  assert.is(i, 0, 'no changes')
  st.set(10)
  await delay(10)
  assert.is(i, 0, 'no update')
})

test.only('fireOnActivate flag', async () => {
  const st = state(0)
  let i = 0
  const ef = effect(
    () => st(),
    () => {
      i++
    },
    {
      activateOnCreate: true,
      fireOnActivate: true,
    },
  )
  await delay(10)
  assert.is(i, 1, 'has changes')
})

test.only('fireOnActivate flag - default true', async () => {
  const st = state(0)
  let i = 0
  const ef = effect(
    () => st(),
    () => {
      i++
    },
    {
      activateOnCreate: true,
    },
  )
  await delay(10)
  assert.is(i, 1, 'has changes')
})

test('effect can stop ', async () => {
  const st = state(0)
  let i = 0
  const ef = effect(
    () => st(),
    () => {
      i++
    },
    {activateOnCreate: true, fireOnActivate: true},
  )
  assert.is(i, 0, 'no changes')
  st.set(10)
  await delay(10)
  assert.is(i, 1, 'has update')
  ef.deactivate()
  st.set(20)
  await delay(10)
  assert.is(i, 1, 'no changes')
})

test.run()
