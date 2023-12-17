import {state, computed} from '../proto'

const test = state(0, {name: 'test'})
const testComp = computed(() => test() + 21, {name: 'test'})
testComp.subscribe((value) => {
  console.log('comp sub', value)
})
test.subscribe((value) => {
  console.log('state sub', value)
})
test.set(2)
console.log(test())

test.set(5)

setTimeout(() => {
  test.set(6)
})
