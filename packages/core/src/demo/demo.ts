import { state, getCachValue, computed } from '../core.js'

const v = state(0)
const c = computed(() => v() + 1, { name: 'c' })
const c2 = computed(() => c() + 2, { name: 'c2' })
const c3 = computed(() => c2() + 3, { name: 'c3' })

console.log(c3())

v.set(1)

console.log(c3())

console.log(v._internal)
