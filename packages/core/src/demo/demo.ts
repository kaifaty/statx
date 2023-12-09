import {state} from '../state'
const v = state(3)

console.log(v())

v.subscribe((data) => console.log(data))

console.log(v)

setTimeout(() => {
  v.set(44)
  v.set(344)
  v.set(234)
}, 300)
