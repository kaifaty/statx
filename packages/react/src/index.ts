/* eslint-disable @typescript-eslint/no-explicit-any */
import type {ReactNode} from 'react'
import {createElement, PureComponent} from 'react'
import type {State, Computed} from '@statx/core'
import {computed, state} from '@statx/core'

type Props = Record<string, unknown>
type PropsX = Record<string, State<unknown>>

type ConvertedRecord<T extends Props> = {
  [K in keyof T]: State<T[K]>
}

class StatxComponent<P extends {fn: () => Computed<unknown>}, S = Props> extends PureComponent<P, S> {
  private unsub?: () => void
  componentWillUnmount(): void {
    this.unsub?.()
  }
  componentDidMount(): void {
    this.unsub = this.props.fn?.().subscribe(() => this.forceUpdate())
  }
  render() {
    return this.props.fn()()
  }
}

const setStateProps = (newProps: Props, stateProps: PropsX) => {
  Object.entries(newProps).map((item) => {
    if (item[0] in stateProps) {
      stateProps[item[0]].set(item[1])
    } else {
      stateProps[item[0]] = state(item[1])
    }
  })
}

export const statxComponent = <T extends Props, K = ConvertedRecord<T>>(
  initFn: (state: K) => () => ReactNode,
  name?: string,
) => {
  let computedFn: Computed<unknown>
  let inited = false
  const stateProps = {} as K
  const statxElement = createElement(StatxComponent as any, {
    fn: () => computedFn,
  })

  return (props: Props) => {
    setStateProps(props, stateProps as PropsX)

    if (!inited) {
      computedFn = computed(initFn(stateProps), {name: `${name}.render`})
      inited = true
    }

    return statxElement
  }
}
