/* eslint-disable @typescript-eslint/no-explicit-any */
import {computed, list, asyncState, state} from '@statx/core'
import {html} from '@statx/element'
import {openVisualizer} from '../open-visualizer'
import {GithubAPI} from './api'

openVisualizer()

type Repo = {
  id: number
  name: string
  pushed_at: string
}

const api = new GithubAPI()

export const userQuery = state('tanstack', {name: 'userQuery'})

export const repos = asyncState<Repo[]>(
  async (signal, prev) => {
    if (signal.signal.aborted) {
      return prev
    }
    console.log(1)
    if (!userQuery()) {
      return []
    }
    try {
      return await api.reposApi(userQuery())
    } catch (e) {
      return []
    }
  },
  [userQuery],
  {autoStart: true, initial: [], strategyDelay: 500, name: 'repos'},
)

export const maxID = computed(
  () => {
    const data = repos()
    if (!data?.length) {
      return 0
    }
    return Math.max(...(data?.map((item) => item.id) ?? []))
  },
  {name: 'maxID'},
)

export const maxText = computed(
  () => {
    if (!maxID()) {
      return html`<div>No data</div>`
    }
    return html`<div>MAX_ID: ${maxID}</div>`
  },
  {name: 'maxText'},
)

/**
 * 

const a1 = state(1, {name: 'A1'})
const a2 = state(1, {name: 'A2'})
const a3 = state(1, {name: 'A3'})
const a4 = state(1, {name: 'A4'})

const l1 = list<Array<number>>([], {name: 'ListNode'})
const i = 0

setInterval(() => {
  // l1.push(i++ + a1())
  // if (l1().length > 4) {
  //   l1().splice(0, 1)
  // }
  a1.set(a1() + 1)
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

const c1 = computed(
  () => {
    const vv = async() ?? 0
    return vv + vv + a2() + a3() + a4() + b2()
  },
  {name: 'C1'},
)
const c2 = computed(() => c1() + 1, {name: 'C2'})
const c3 = computed(() => c1() + 1, {name: 'C3'})
const c4 = computed(() => c1() + 1, {name: 'C4'})

b1.subscribe(() => {})

const c1Listener = () => {}
c1.subscribe(c1Listener)

c2.subscribe(() => {})
c3.subscribe(() => {})
c4.subscribe(() => {}, 'demo listener')

async.status.subscribe((v) => {
  console.log(`=+++>`, v)
})
 */
