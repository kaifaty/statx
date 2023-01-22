import {state, computed} from '../core.js'

const v1 = state(1, {name: 'v1'})
const v2 = state(2, {name: 'v2'})
const v3 = state(3, {name: 'v3'})

const c = computed(() => v1() + v2() + v3(), {name: 'c'})

console.log(v1._internal)
console.log(v2._internal)
console.log(v3._internal)
console.log(c._internal)

c()
