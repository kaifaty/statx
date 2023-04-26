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
  console.log(state(0)())
}
subscriptions()
