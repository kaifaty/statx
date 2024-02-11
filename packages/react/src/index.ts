import type {ReactElement, ReactNode} from 'react'
import {Fragment, useMemo, createElement, useEffect, useState} from 'react'
import type {PublicState, StateType} from '@statx/core'

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
