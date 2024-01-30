/* eslint-disable @typescript-eslint/no-explicit-any */
import {state, computed} from '../index'
import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {delay} from './utils'

test('clear map', () => {
  const a = state(0)
  a.subscribe(() => {})
})
test('No values when no links and listeners', () => {
  const a = state(0)
  const __ = computed(() => a() + 1)

  //assert.is(nodesMap.getCount('children'), 0)
  //assert.is(nodesMap.getCount('listeners'), 0)
})
test('Have listener in map', async () => {
  const v = state(0)
  const listener = () => {}
  v.subscribe(listener)

  //assert.is(nodesMap.getCount('listeners'), 1)
  //assert.is(nodes.findListener(v as any, listener as any), listener)
})
test('Links between state and computed', () => {
  const a = state(0)
  const b = computed(() => a() + 1)
  const listener = () => {}
  b.subscribe(listener)

  //assert.is(nodes.findListener(b, listener), listener, 'has listener')
  //assert.is(nodes.findChild(a, b), b, 'has connection to child')
  // assert.is(nodes.findParent(b, a), a, 'has connection to parent')

  assert.is(b(), 1, 'right computed')
})

test('Right dependecy', () => {
  const a1 = state('a1', {name: 'a1'})
  const b1 = computed(() => 'b1' + a1(), {name: 'b1'})
  const b2 = computed(() => '---' + b1() + '---', {name: 'b2'})
  const listener1 = () => {}
  const listener2 = () => {}
  b1.subscribe(listener1)
  b2.subscribe(listener2)
})

test('Right subscribtion order call', async () => {
  const a = state(0)
  const b = computed(() => a() + 1)
  const b2 = computed(() => b() + '---')
  let res = ''
  b.subscribe(() => {
    res += '1'
  })
  b2.subscribe(() => {
    res += '2'
  })
  a.set(1)
  await 1
  assert.is(res, '12')
})

test('Remove listener', async () => {
  const a = state(0)
  const b = computed(() => a() + 1)
  const b2 = computed(() => b() + '---')

  const unb1 = b.subscribe(console.log)
  const unb2 = b2.subscribe(console.log)

  //assert.is(nodes.findParent(b, a), a)
  //assert.is(nodes.findParent(b2, b), b)

  a.set(a() + 1)
  await delay(1)
  unb1()

  await delay(1)
  unb2()
})

test('Unsubscribe may be only once', () => {})

test.run()
