/* eslint-disable @typescript-eslint/no-explicit-any */
import {computed, list, asyncState, state} from '@statx/core'
import {XElement, html} from '@statx/element'
import {initSeparateDebugger} from 'src/init-debugger'

initSeparateDebugger()

const a1 = state(1, {name: 'A1'})
const a2 = state(1, {name: 'A2'})
const a3 = state(1, {name: 'A3'})
const a4 = state(1, {name: 'A4'})

const l1 = list<Array<number>>([], {name: 'ListNode'})
let i = 0
setInterval(() => {
  l1.push(i++ + a1())
  if (l1().length > 4) {
    l1().splice(0, 1)
  }
  a1.set(a1() + 1)
  //set.add(s)
}, 1000)

export const b1 = computed(() => a1() * 10 + a2(), {name: 'B1'})
export const b2 = computed(() => a2() + 10 + a3() + a4(), {name: 'B2'})
export const b4 = computed(() => a2() + 10 + a3() + a4(), {name: 'B4'})

const async = asyncState(
  async () => {
    await new Promise((r) => setTimeout(r, 90))
    return b2() + a1()
  },
  [a1, b2],
  {autoStart: true, name: 'asyncNode1'},
)
const async2 = asyncState(
  async () => {
    await new Promise((r) => setTimeout(r, 200))
    return b1() + a3()
  },
  [a1, b2],
  {autoStart: true, name: 'asyncNode2'},
)

const c1 = computed(
  () => {
    return (async() ?? 0) + (async2() ?? 0) + a2() + a3() + a4() + b2()
  },
  {name: 'C1'},
)
const c2 = computed(() => c1() + 1, {name: 'C2'})
const c3 = computed(() => c1() + 1, {name: 'C3'})
const c4 = computed(() => c1() + 1, {name: 'C4'})

b1.subscribe(() => {})
b2.subscribe(() => {})

const c1Listener = () => {}
c1.subscribe(c1Listener)

c2.subscribe(() => {})
c3.subscribe(() => {})
c4.subscribe(() => {})

class TestClass extends XElement {
  render() {
    return html`
      <div>
        <div>async1: ${async()}</div>
        <div>async2: ${async2()}</div>
        <div>c1: ${c1()}</div>
        <div>List: ${l1()}</div>
      </div>
    `
  }
}

customElements.define('test-element', TestClass)
