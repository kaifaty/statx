import {useStatxComp} from '../index.js'
import {state, computed} from '@statx/core'
import {createRoot} from 'react-dom/client'

const timestamp = state(0)

const readableTime = computed(() => {
  const current = timestamp()
  console.log('recalc', current)
  if (current === 0) {
    return 'Начало времен'
  }
  return new Date(current).toISOString().substring(0, 19)
})

let stamp = 0

setInterval(() => {
  for (let i = 0; i < 6000; i++) {
    stamp++
    timestamp.set(stamp * 1000)
  }
}, 1000)

let rendersCount = 0

const App = () => {
  rendersCount++
  const time = useStatxComp(readableTime)

  return (
    <>
      <h1>Renders: {rendersCount}</h1>
      <h2>Time: {time}</h2>
    </>
  )
}

const root = createRoot(document.getElementById('root') as HTMLDivElement)
root.render(<App />)
