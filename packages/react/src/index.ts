import {Fragment, useMemo, createElement, ReactElement, ReactNode, useEffect, useState} from 'react'
import type {Common, StateType} from '@statx/core'

export const useStatx = <T extends StateType>(state: Common<T>): T => {
  const [inner, setInner] = useState<T>(state())

  useEffect(() => {
    return state.subscribe(setInner)
  }, [])

  return inner
}

export const useSXComponent = <T extends StateType>(
  state: Common<T>,
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
