import {computed} from 'src'
import {state} from '../state'

const v = state(1, {name: 'state'})
const reducer = computed<number>(
  () => {
    const value = v()
    console.log(value, v)
    setTimeout(() => {
      console.log('===', v())
    })
    return value + 10
  },
  {initial: 10, name: 'computed'},
)
console.log('>', v, v.set)
v.set(1)
v.set(2)
v.set(3)
v.set(10)
console.log('>>')
console.log(reducer())
console.log('>>>')
console.log(v, reducer)
