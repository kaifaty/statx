import {test} from 'uvu'
import * as assert from 'uvu/assert'

import {state, computed, action, getCachValue} from './core.js'

type Mock = {
  (): void
  calls: number
}
const createMockFn = (): Mock => {
  let calls = 0
  const mock = function () {
    calls++
  }
  Object.defineProperty(mock, 'calls', {
    get() {
      return calls
    },
  })
  return mock as Mock
}

test('Defaul value', () => {
  assert.is(state(0)(), 0)
})

test('Name is settable', () => {
  assert.is(state(0, {name: 'name'}).name, 'name')
})

test('Computation test', async () => {
  const entry = state(0)
  const a = computed(() => entry())
  const b = computed(() => a() + 1)
  const c = computed(() => a() + 1)
  const d = computed(() => b() + c())
  const e = computed(() => d() + 1)
  const f = computed(() => d() + e())
  const g = computed(() => d() + e())
  const h = computed(() => f() + g())
  const _a = () => entry()
  const _b = () => _a() + 1
  const _c = () => _a() + 1
  const _d = () => _b() + _c()
  const _e = () => _d() + 1
  const _f = () => _d() + _e()
  const _g = () => _d() + _e()
  const _h = () => _f() + _g()

  const results = {
    b: 0,
    c: 0,
    h: 0,
  }
  b.subscribe((v: any) => (results.b = v))
  c.subscribe((v: any) => (results.c = v))
  h.subscribe((v: any) => (results.h = v))

  for (let i = -10; i < 20; i++) {
    entry.set(i)
    await 1
    console.log()
    assert.is(results.h, _h())
  }

  //assert.is(results.c, _c())
  //assert.is(results.h, _h())
})

test('State may be reducer', () => {
  const v = state(0)
  const reducer = computed(() => v() + 10, {initial: 10})

  v.set(1)
  v.set(2)
  v.set(3)
  v.set(10)

  assert.is(reducer(), 20)
})
test('Subscription of computable state', async () => {
  const fn = createMockFn()
  const s1 = state(0)
  const s2 = state(2)
  const c2 = computed(() => s1() + 10)
  const c3 = computed(() => s1() + c2() + s2())
  const _c3 = () => s1() + s1() + 10 + s2()
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
  assert.is(test, _c3())
  assert.is(fn.calls, 1)
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
test(`Recalculation of subscribers`, async () => {
  const v = state(23)
  const c = computed(() => v() * 100 + 20)

  // No calculations if no subs
  assert.is(getCachValue(c._internal), undefined)

  const unsub = c.subscribe(() => {
    1
  })
  // Recalc on subscribe
  assert.is(getCachValue(c._internal), 23 * 100 + 20)

  v.set(1)
  await 1

  assert.is(getCachValue(c._internal), 1 * 100 + 20)

  // No recalc after unsub
  unsub()
  v.set(0)

  assert.is(getCachValue(c._internal), 1 * 100 + 20)
})
test(`Recalculate all computed tree`, () => {
  const v = state(0)
  const c = computed(() => v() + 1, {name: 'c'})
  const c2 = computed(() => c() + 2, {name: 'c2'})
  const c3 = computed(() => c2() + 3, {name: 'c3'})

  assert.is(c3(), 6)

  v.set(1)

  assert.is(c3(), 7)
})

test('Check right dependencies of computed state', () => {
  const v1 = state(1, {name: 'v1'})
  const v2 = state(2, {name: 'v2'})
  const v3 = state(3, {name: 'v3'})

  const c = computed(() => v1() + v2() + v3(), {name: 'c'})

  c()
  assert.is(v1._internal.childs.has(c._internal), true)
  assert.is(v2._internal.childs.has(c._internal), true)
  assert.is(v3._internal.childs.has(c._internal), true)

  assert.is(c._internal.depends.has(v1._internal), true)
  assert.is(c._internal.depends.has(v2._internal), true)
  assert.is(c._internal.depends.has(v3._internal), true)
})

test('Dont update if value not changed', () => {
  const mock = createMockFn()
  const v1 = state(0)
  const c = computed(() => v1() + 1)
  c.subscribe(() => {
    mock()
  })
  for (let i = 0; i < 10; i++) v1.set(i)

  assert.is(mock.calls, 0)
})

test('karl test', async () => {
  // https://github.com/kaifaty/statx

  const res: number[] = []
  const numbers = Array.from({length: 5}, (_, i) => i)

  const fib = (n: number): number => (n < 2 ? 1 : fib(n - 1) + fib(n - 2))
  const hard = (n: number, l: string) => {
    // console.log(l)
    return n + fib(16)
  }

  const A = state(0)
  const B = state(0)
  const C = computed(() => (A() % 2) + (B() % 2))
  const D = computed(() => numbers.map((i) => ({x: i + (A() % 2) - (B() % 2)})))
  const E = computed(() => hard(C() + A() + D()[0].x, '\nE'))
  const F = computed(() => hard(D()[2].x || B(), 'F'))
  const G = computed(() => C() + (C() || E() % 2) + D()[4].x + F())

  G.subscribe((v) => res.push(hard(v, 'H')))
  G.subscribe((v) => res.push(v))
  F.subscribe((v) => res.push(hard(v, 'J')))

  const _C = () => (A() % 2) + (B() % 2)
  const _D = () => numbers.map((i) => ({x: i + (A() % 2) - (B() % 2)}))
  const _E = () => hard(_C() + A() + _D()[0].x, '\nE')
  const _F = () => hard(_D()[2].x || B(), 'F')
  const _G = () => _C() + (_C() || _E() % 2) + _D()[4].x + _F()

  const run = async (value: number) => {
    res.length = 0
    B.set(1)
    A.set(1 + value * 2) // H

    A.set(2 + value * 2)
    B.set(2) // EH

    await 1
    assert.is(C(), _C())
    assert.is(D().toString(), _D().toString())
    assert.is(E().toString(), _E().toString())
    assert.is(F().toString(), _F().toString())
    assert.is(G().toString(), _G().toString())

    assert.is(res.toString(), [3196, 3201, 1604].toString())
  }

  await run(15)
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
