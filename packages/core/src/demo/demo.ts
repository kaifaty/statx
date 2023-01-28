import {state, computed} from '../core.js'

const computations = async () => {
  const entry = state(0, {name: 'entry'})
  const a = computed(() => entry(), {name: 'a'})
  const b = computed(() => a() + 1, {name: 'b'})
  const c = computed(() => a() + 1, {name: 'c'})
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
  entry.set(1)
  await 1

  console.log(_b() === b())
  console.log(_c() === c())
  console.log(_h() === h())
}

const subscriptions = async () => {
  const s1 = state(0, {name: 's1'})
  const s2 = state(2, {name: 's2'})
  const c2 = computed(() => s1() + 10, {name: 'c2'})
  const c3 = computed(() => s1() + c2() + s2(), {name: 'c3'})
  const _c3 = () => s1() + s1() + 10 + s2()
  let test = 0
  c3.subscribe((v) => {
    console.log('Значение при подписке', v)
    test = v
  })
  s1.set(10)
  s2.set(6)
  s2.set(1)
  s2.set(2)
  await 1
  console.log(c3, test, c3(), c3() === _c3())
}
subscriptions()
