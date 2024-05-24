import type {ReactElement, ReactNode} from 'react'
import {Fragment, useMemo, createElement, useEffect, useState, PureComponent} from 'react'
import {computed, isComputed, type PublicState, type StateType} from '@statx/core'

export const useStatx = <T extends StateType>(state: PublicState<T>): T => {
  const [inner, setInner] = useState<T>(state())

  useEffect(() => {
    return state.subscribe(setInner)
  }, [])

  return inner
}

export const useSXComponent = <T extends StateType>(
  state: PublicState<T>,
  f?: (value: T) => ReactNode,
): ReactElement => {
  return useMemo(() => {
    return createElement(() => {
      const res = useStatx<T>(state)
      if (!res) {
        return null
      }
      if (f) {
        const mappedResult = f(res)
        return createElement(Fragment, {}, mappedResult)
      }
      if (typeof res === 'object') {
        return createElement(Fragment, {}, JSON.stringify(res))
      }
      return createElement(Fragment, {}, res.toString())
    })
  }, [])
}

export class StatxComponent<P = {}, S = {}> extends PureComponent {
  _unsub: () => void 
  constructor(props: P) {
    super(props)
    const computedRender = computed(currentRender, {name: `${this.constructor.name}.render`})

    if (isComputed(this.render)) {
      return
    }
    const currentRender = this.render.bind(this)

    this._unsub = computedRender.subscribe(() => {
      this.forceUpdate()
    })

    Object.defineProperty(this, 'render', {
      value: computedRender,
    })
  }
}
