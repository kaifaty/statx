/* eslint-disable @typescript-eslint/no-explicit-any */
import {state, computed} from '../index'

const test = async () => {
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

  console.log(performance.now())
  for (let i = -10; i < 20; i++) {
    entry.set(i)
    await 1
    //console.log(results.h, _h())
    //console.log(h(), _h())
    // console.log(a)
    console.log(`a`, a, a(), _a())
    console.log(`b`, b, b(), _b())
    //assert.is(results.h, _h())
    if (i >= -9) {
      //break
    }
  }
  console.log(performance.now())
  await new Promise((r) => setTimeout(r, 1))
}
test()
