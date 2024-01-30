/* eslint-disable @typescript-eslint/no-explicit-any */
import {state, nodesMap, computed, NodeMapValidators} from '../index'
import {test} from 'uvu'
import * as assert from 'uvu/assert'
import {delay} from './utils'

const nodes = new NodeMapValidators(nodesMap)
test.before.each(() => {
  nodes.clearMap()
})
test('clear map', () => {
  const a = state(0)
  a.subscribe(() => {})
  assert.is(nodes.validate(a as any, 'listeners').count, 1, 'listeners count')
  nodes.clearMap()
  assert.is(nodes.validate(a as any, 'listeners').count, 0, 'listeners count')
})
test('No values when no links and listeners', () => {
  const a = state(0)
  const __ = computed(() => a() + 1)

  assert.is(nodesMap.getCount('children'), 0)
  assert.is(nodesMap.getCount('listeners'), 0)
  assert.is(nodesMap.getCount('parents'), 0)
})
test('Have listener in map', async () => {
  const v = state(0)
  const listener = () => {}
  v.subscribe(listener)

  assert.is(nodesMap.getCount('listeners'), 1)
  assert.is(nodes.findListener(v as any, listener as any), listener)
})
test('Links between state and computed', () => {
  const a = state(0)
  const b = computed(() => a() + 1)
  const listener = () => {}
  b.subscribe(listener)

  assert.is(nodes.findListener(b, listener), listener, 'has listener')
  assert.is(nodes.findChild(a, b), b, 'has connection to child')
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

  assert.is(nodes.findChild(a1, b1), b1, 'dep 1')
  assert.is(nodes.findChild(b1, b2), b2, 'dep 2')
  //assert.is(nodes.findParent(b1, a1), a1, 'parent 1')
  //assert.is(nodes.findParent(b2, b1), b1, 'parent 2')
  assert.is(nodes.findListener(b1, listener1), listener1, 'listener 1')
  assert.is(nodes.findListener(b2, listener2), listener2, 'listener 1')
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

  assert.is(nodes.findChild(a, b), b)
  assert.is(nodes.findChild(b, b2), b2)

  assert.is(nodes.findListener(b, console.log), console.log)
  assert.is(nodes.findListener(b2, console.log), console.log)

  a.set(a() + 1)
  await delay(1)
  unb1()

  //assert.is(nodes.findParent(b, a), a)
  //assert.is(nodes.findParent(b2, b), b)

  assert.is(nodes.findChild(a, b), b)
  assert.is(nodes.findChild(b, b2), b2)

  assert.is(nodes.findListener(b, console.log), undefined)
  assert.is(nodes.findListener(b2, console.log), console.log)

  await delay(1)
  unb2()

  //assert.is(nodes.findParent(b, a), undefined)
  //assert.is(nodes.findParent(b2, b), undefined)

  assert.is(nodes.findChild(a, b), undefined)
  assert.is(nodes.findChild(b, b2), undefined)

  assert.is(nodes.findListener(b, console.log), undefined)
  assert.is(nodes.findListener(b2, console.log), undefined)
})

test('Unsubscribe may be only once', () => {})

test.run()
