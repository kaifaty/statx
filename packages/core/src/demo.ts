/* eslint-disable @typescript-eslint/no-explicit-any */
import {state, computed, asyncState} from './index'
import {delay} from './tests/utils'

const test = async () => {
  const dep1 = state(1)
  const dep2 = state(2)

  const res = asyncState(
    async () => {
      await delay(100)
      return dep1() + dep2()
    },
    [dep1, dep2],
    {initial: 0},
  )

  res.start()
  await delay(200)
  dep2.set(20)
  await delay(200)
  console.log({dep2, res}, res())
}

test()
