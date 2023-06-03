import {useStatxComp, useStatx} from '../index.js'
import {state} from '@statx/core'
import {createRoot} from 'react-dom/client'

const nameObject = state({name: 'John'})

setInterval(() => {
  nameObject.set({name: Date.now().toString()})
}, 1)

let rendersCount = 0

const App = () => {
  rendersCount++
  const name = useStatxComp(nameObject, (data) => {
    return <input value={data.name} />
  })

  return (
    <>
      <h1>Renders: {rendersCount}</h1>
      <h2>Time: {name}</h2>
    </>
  )
}

const root = createRoot(document.getElementById('root') as HTMLDivElement)
root.render(<App />)
