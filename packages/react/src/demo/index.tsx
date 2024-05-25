/* eslint-disable @typescript-eslint/ban-types */
import {createRoot} from 'react-dom/client'
import {StrictMode, useEffect, useState} from 'react'
import React from 'react'
import {statxComponent} from '../index'
import {computed} from '@statx/core'

const Test = statxComponent<{time: number}>(({time}) => {
  console.log('init Test')

  const isMoreThen10 = computed(() => {
    console.log('isMoreThen10')
    return time() > 10
  })

  const testData = computed(() => {
    if (!isMoreThen10()) {
      return 'Меньше 10'
    }
    return 'Больше 10'
  })

  return () => {
    return (
      <>
        <h1>SimpleComponent</h1>
        <h2>time: {time()}</h2>
        <p>{testData()}</p>
      </>
    )
  }
}, 'Test')

const App = () => {
  const [v, setV] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setV((v) => v + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  return (
    <>
      <Test time={v} />
    </>
  )
}

const root = createRoot(document.getElementById('root') as HTMLDivElement)
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
)
