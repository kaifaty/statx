import {computed, isComputed, state} from '@statx/core'
import {createRoot} from 'react-dom/client'
import {PureComponent, useEffect, useState} from 'react'

const nameObject = state({name: 'John'})

setInterval(() => {
  nameObject.set({name: Date.now().toString()})
}, 1)

const renderCount = 0

export class StatxComponent<P = {}, S = {}> extends PureComponent {
  _unsub: () => void
  constructor(props: P) {
    super(props)

    if (isComputed(this.render)) {
      return
    }
    const currentRender = this.render.bind(this)
    const computedRender = computed(currentRender, {name: `${this.constructor.name}.render`})
    this._unsub = computedRender.subscribe(() => {
      this.forceUpdate()
    })

    Object.defineProperty(this, 'render', {
      value: computedRender,
    })
  }
}

class AppComonent extends PureComponent<{time: number}> {
  constructor(props) {
    super(props)
  }
  render() {
    console.log('render')
    return this.props.time
  }
}

const App = () => {
  const [v, setV] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => {
      setV((v) => v + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])
  return <AppComonent time={v} />
}

const root = createRoot(document.getElementById('root') as HTMLDivElement)
root.render(<App />)
