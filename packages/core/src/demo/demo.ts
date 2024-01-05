/* eslint-disable @typescript-eslint/no-explicit-any */
import {asyncState} from '../index'

const async = asyncState(
  async () => {
    await new Promise((r) => setTimeout(r, 100))
    return 123
  },
  [],
  {autoStart: false},
)

const f = async () => {
  console.log('>', await async)
  setTimeout(async () => {
    console.log('after 3sec')
    await async
    console.log('>>', await async)
  }, 1000)
}

f()

setTimeout(() => {
  async.start()
}, 1000)
