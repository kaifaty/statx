/* eslint-disable @typescript-eslint/no-explicit-any */
import {state, computed} from './index'

const test = async () => {
  const v = state(0, {name: 'v'})
  const c = computed(() => v() + 1, {name: 'c'})
  const c2 = computed(() => c() + 2, {name: 'c2'})
  const c3 = computed(() => c2() + 3, {name: 'c3'})

  console.log(c3())
  v.set(1)
  await 1
  console.log(c3())
  console.log({v, c3})
}

test()
