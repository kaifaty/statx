/* eslint-disable @typescript-eslint/no-explicit-any */
import {test} from 'uvu'
import * as assert from 'uvu/assert'

import type {CommonInternal} from '../index.js'
import {asyncState, computed, state, list} from '../index.js'
import {cachedState} from '../cached.js'
import {asInternal, LinkedList} from '../helpers/utils'
import {delay} from '../nodes/utils.js'

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

test('Default value', () => {
  assert.is(state(0)(), 0)
})

test('Name is settable', () => {
  assert.is(state(0, {name: 'name'}).name, 'name')
})

test('list test', () => {
  const entry = state(0)
  const a = computed(() => entry() + 1, {name: 'a'})
  const a2 = computed(() => entry() + 1, {name: 'a'})
  const list = new LinkedList(asInternal(entry), 1)

  list.remove(list.head!)

  assert.is(list.head, undefined)
  assert.is(list.tail, undefined)

  list.push(asInternal(entry), 1)
  assert.is(list.head?.value, entry)
  assert.is(list.tail?.value, entry)

  list.push(a as any, 2)

  assert.is(list.length, 2)

  let current = list.head
  let cnt = 0
  while (current) {
    cnt++
    current = current.next
  }

  assert.is(cnt, 2)

  if (list.tail) {
    list.remove(list.tail)
  }

  assert.is(list.tail?.value, entry)
  assert.is(list.head?.value, entry)

  list.push(a as any, 2)

  assert.is(list.tail?.value, a)
  assert.is(list.head?.value, entry)

  list.push(a2 as any, 2)

  assert.is(list.tail?.prev?.value, a)
  assert.is(list.tail?.value, a2)
  assert.is(list.head?.value, entry)
  assert.is(list.head?.next?.value, a)
  assert.is(list.head?.next?.next?.prev?.prev?.value, entry)
  assert.is(list.head?.next?.next?.value, a2)
  assert.is(list.tail?.prev?.prev?.value, entry)
})

test('simple computation text', async () => {
  const entry = state(0)
  const a = computed(() => entry() + 1, {name: 'a'})
  let res = 0
  a.subscribe((v: any) => (res = v))
  entry.set(1)
  await 1
  assert.is(res, 2)
})

test('Computation test', async () => {
  const entry = state(0)
  const a = computed(() => entry(), {name: 'a'})
  const b = computed(() => a() + 1, {name: 'b'})
  const c = computed(() => a() + 1, {name: 'c'})
  const d = computed(() => b() + c(), {name: 'd'})
  const e = computed(() => d() + 1, {name: 'e'})
  const f = computed(() => d() + e(), {name: 'f'})
  const g = computed(() => d() + e(), {name: 'g'})
  const h = computed(() => f() + g(), {name: 'h'})

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
    assert.is(results.h, _h())
  }
  await new Promise((r) => setTimeout(r, 1))

  assert.is(results.c, _c())
  assert.is(results.h, _h())
})

test('State may be reducer', () => {
  const v = state(0)
  const reducer = computed<number>(() => v() + 10, {initial: 10})

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
  assert.is(test, 0, '1')
  // after all microtasks
  await 1
  assert.is(test, _c3(), '2')
  assert.is(fn.calls, 1, 'calls exeption')
})

test(`Recalculation of subscribers`, async () => {
  const v = state(23)
  const c = computed(() => v() * 100 + 20)

  // No calculations if no subs
  assert.is(c.peek(), undefined)

  const unsub = c.subscribe(() => {
    1
  })
  // Recalc on subscribe

  assert.is(c.peek(), 23 * 100 + 20)

  v.set(1)
  await 1

  assert.is(c.peek(), 1 * 100 + 20)

  // No recalc after unsub
  unsub()
  v.set(0)

  assert.is(c.peek(), 1 * 100 + 20)
})

test(`Recalculate all computed tree`, async () => {
  const v = state(0, {name: 'v'})
  const c = computed(() => v() + 1, {name: 'c'})
  const c2 = computed(() => c() + 2, {name: 'c2'})
  const c3 = computed(() => c2() + 3, {name: 'c3'})

  assert.is(c3(), 6)

  v.set(1)
  await 1

  assert.is(v(), 1)
  assert.is(c(), 2)
  assert.is(c3(), 7)
  assert.is(c2(), 4)
})

test('Check right dependencies of computed state', () => {
  const v1 = state(1, {name: 'v1'}) as any
  const v2 = state(2, {name: 'v2'}) as any
  const v3 = state(3, {name: 'v3'}) as any

  const c = computed(() => v1() + v2() + v3(), {name: 'c'}) as any

  c()
  assert.is(c(), 6)
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const hard = (n: number, _: string) => {
    return n + fib(16)
  }

  const A = state(0)
  const B = state(0)
  const C = computed(() => (A() % 2) + (B() % 2))
  const D = computed(() => numbers.map((i) => ({x: i + (A() % 2) - (B() % 2)})))
  const E = computed(() => hard(C() + A() + D()[0].x, '\nE'))
  const F = computed(() => hard(D()[2].x || B(), 'F'))
  const G = computed(() => C() + (C() || E() % 2) + D()[4].x + F())

  F.subscribe((v) => res.push(hard(v, 'J')))
  G.subscribe((v) => res.push(hard(v, 'H')))
  G.subscribe((v) => res.push(v))

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

test('from compuited  cache', async () => {
  const st = state(10)
  let calls = 0

  const {call: calcer} = cachedState(st, (currentValue: number, data: number) => {
    calls++
    return currentValue * data
  })

  assert.is(calcer(10), 100, '1')
  assert.is(calls, 1, '2')
  assert.is(calcer(10), 100, '3')
  assert.is(calls, 1, '4')
  st.set(1)
  await 1
  assert.is(calcer(10), 10, '5')

  assert.is(calls, 2, '6')
  assert.is(calcer(10), 10, '7')
  assert.is(calls, 2, '8')
  assert.is(calcer(11), 11, '9')
  assert.is(calls, 3, '10')
  assert.is(calcer(12), 12, '11')
  assert.is(calls, 4, '12')
  assert.is(calcer(11), 11, '13')
  assert.is(calls, 4, '14')
  assert.is(calcer(12), 12, '15')
  assert.is(calls, 4, '16')
})

test('asyncState check state change', async () => {
  const dep1 = state(1)
  const dep2 = state(2)

  const res = asyncState(async () => {
    await delay(100)
    return dep1() + dep2()
  }, [dep1, dep2])

  res.start()
  assert.is(res(), undefined)
  await delay(200)
  assert.is(res(), 3)
})

test('asyncState check initial state change', async () => {
  const dep1 = state(1)
  const dep2 = state(2)

  const res = asyncState(
    async () => {
      await delay(100)
      return dep1() + dep2()
    },
    [dep1, dep2],
    {initialValue: 0},
  )

  res.start()
  assert.is(res(), 0, 'must be 0')
  await delay(200)
  assert.is(res(), 3, 'must be 3')
})

test('asyncState check state observe deps', async () => {
  const dep1 = state(1)
  const dep2 = state(2)

  const res = asyncState(
    async () => {
      await delay(100)
      return dep1() + dep2()
    },
    [dep1, dep2],
    {initialValue: 0},
  )

  res.start()
  assert.is(res(), 0, '1')
  await delay(200)
  assert.is(res(), 3, '2')
  dep2.set(20)
  await delay(200)
  assert.is(res(), 21, '3')
})

test('asyncState check state observe can stop', async () => {
  const dep1 = state(1)
  const dep2 = state(2)

  const res = asyncState(
    async () => {
      await delay(100)
      return dep1() + dep2()
    },
    [dep1, dep2],
    {initialValue: 0},
  )

  res.start()
  assert.is(res(), 0)
  await delay(200)
  assert.is(res(), 3)
  dep2.set(20)
  await delay(200)
  assert.is(res(), 21)
  res.stop()
  dep2.set(0)
  await delay(200)
  assert.is(res(), 21)
})

test('asyncState check last-win strategy', async () => {
  const dep1 = state(1)
  const dep2 = state(2)

  const res = asyncState(
    async () => {
      await delay(100)
      return dep1() + dep2()
    },
    [dep1, dep2],
    {initialValue: 0},
  )

  res.start()
  dep2.set(1)
  await delay(50)
  assert.is(res(), 0)
  dep2.set(3)
  await delay(50)
  assert.is(res(), 0)
  dep2.set(4)
  await delay(50)
  assert.is(res(), 0)
  await delay(55)
  assert.is(res(), 5)
})

test('asyncState is maxWait works with last-win', async () => {
  const dep1 = state(1)
  const dep2 = state(2)

  const res = asyncState(
    async () => {
      await delay(80)
      return dep1() + dep2()
    },
    [dep1, dep2],
    {initialValue: 0, strategy: 'last-win', maxWait: 120},
  )

  res.start()
  dep2.set(1)

  await delay(50)
  assert.is(res(), 0)
  dep2.set(2)

  await delay(50)
  assert.is(res(), 0)
  dep2.set(3)

  await delay(100)
  assert.is(res(), 4)
})

test('asyncState can be used with await', async () => {
  const async = asyncState(
    async () => {
      await new Promise((r) => setTimeout(r, 50))
      return 123
    },
    [],
    {activateOnCreate: true},
  )
  const v = await async
  assert.is(v, 123)

  const v2 = await new Promise((r) =>
    setTimeout(async () => {
      const v = await async
      r(v)
    }, 100),
  )
  assert.is(v2, 123)
})

test('asyncState can be used with await', async () => {
  const async = asyncState(
    async () => {
      await new Promise((r) => setTimeout(r, 50))
      return 123
    },
    [],
    {activateOnCreate: true},
  )
  const v = await async
  assert.is(v, 123)

  const v2 = await new Promise((r) =>
    setTimeout(async () => {
      const v = await async
      r(v)
    }, 100),
  )
  assert.is(v2, 123)
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
  const a = state(0) as any as CommonInternal

  const unb1 = a.subscribe(console.log)
  const unb2 = a.subscribe(console.log)

  assert.is(a.deps.length, 2, '1')
  unb1()
  assert.is(a.deps.length, 1, '2')
  unb1()
  assert.is(a.deps.length, 1, '3')
  unb2()
  assert.is(a.deps, undefined, '4')
})

test.skip('Child computation must not to be trigger if value not change', async () => {
  let res = 0
  const a = state(1)
  const b = computed(() => {
    if (a() > 10) {
      return 2
    }
    return 1
  })
  const c = computed(() => {
    return b() + 1
  })
  c.subscribe(() => {
    res++
  })
  a.set(2)
  await 1
  a.set(3)
  await 1
  a.set(4)
  await 1

  assert.is(res, 0, '1')
  assert.is(b(), 1, '2')
  assert.is(c(), 2, '3')
  a.set(14)
  await 1

  assert.is(res, 1, '4')
  assert.is(b(), 2, '5')

  assert.is(c(), 3, '6')
})

test.run()
