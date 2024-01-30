/* eslint-disable @typescript-eslint/no-explicit-any */
import {state, logs, computed} from './index'
import {delay} from './tests/utils'
logs.enabled = true

const test = async () => {
  const entry = state(0)
  const a = computed(() => entry() + 1, {name: 'a'})
  const b = computed(() => a() + 1, {name: 'b'})
  const c = computed(() => b() + 1, {name: 'c'})
  const d = computed(() => b() + c(), {name: 'd'})
  const e = computed(() => d() + 1, {name: 'e'})
  const f = computed(() => d() + e(), {name: 'f'})
  const g = computed(() => d() + e(), {name: 'g'})
  const h = computed(() => f() + g(), {name: 'h'})

  const _a = () => entry() + 1
  const _b = () => _a() + 1
  const _c = () => _b() + 1
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
  //b.subscribe((v: any) => (results.b = v))
  //c.subscribe((v: any) => (results.c = v))
  //h.subscribe((v: any) => (results.h = v))

  for (let i = -10; i < 10; i++) {
    //entry.set(i)
    //console.log('a', a())
    // console.log(results.h, _h(), results.h === _h())
    //console.log(h(), _h())
  }
  entry.set(2)
  await delay(2)

  /**
   *
   */
}

test()
