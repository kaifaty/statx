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

test('activate on create', async () => {
  const st = state(0)
  let i = 0
  const ef = effect(
    () => st(),
    () => {
      i++
    },
    {fireOnActivate: false},
  )
  assert.is(i, 0, 'no changes')
  st.set(10)
  await delay(10)
  assert.is(i, 1, 'has update')
})

test('fireOnActivate flag', async () => {
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
  assert.is(i, 0, 'no changes')

  await delay(10)
  assert.is(i, 1, 'has update')
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
