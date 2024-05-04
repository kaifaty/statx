/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal, IList} from '../helpers/type.js'
import {computed} from './computed.js'
import {isStatxFn} from '../helpers/utils'
import {state} from './state.js'
import {notify} from './proto-state.js'
import type {Computed} from '../../build/types/types'

export function Push(this: IList, ...args: Array<unknown>) {
  this.set([...this.currentValue, ...args])
  return this.currentValue.length
}

export function UnShift(this: IList, ...args: Array<unknown>) {
  this.set([...args, ...this.currentValue])
  return this.currentValue.length
}

export function Pop(this: IList) {
  const lastValue = this.currentValue[this.currentValue.length - 1]
  this.set(this.currentValue.slice(0, this.currentValue.length - 1))
  return lastValue
}

export function Shift(this: IList) {
  const firstValue = this.currentValue[0]
  this.set(this.currentValue.slice(1))
  return firstValue
}

export function At(this: IList, position: number) {
  const length = this.currentValue.length
  if (position < 0) {
    return this.currentValue[length + position]
  }
  return this.currentValue[position]
}

export function Sort(this: IList, fn?: (a: unknown, b: unknown) => number) {
  const sorted = this.currentValue.slice().sort(fn)
  this.set(sorted)
  return sorted
}

export function Map(this: IList, fn: (valueState: CommonInternal, value: unknown) => unknown) {
  const calculated: Array<Computed<unknown>> = []

  const res = computed(
    () => {
      const currentState = this.get() as Array<CommonInternal>
      const max = Math.max(currentState.length, calculated.length)
      for (let i = 0; i < max; i++) {
        const newItemState = currentState[i]
        const newItem = newItemState?.peek()
        const prevValue = res.peek()?.[i]?.peek()

        if (newItem !== undefined && prevValue === undefined) {
          calculated[i] = computed(
            () => {
              return fn(newItemState, newItemState.get())
            },
            {name: this.name + `.${i}`},
          )
        } else if (newItem === undefined && prevValue !== undefined) {
          calculated.splice(i, max)
          break
        }
      }
      return calculated
    },
    {name: this.name + '.map'},
  )
  res.subscribe((v) => {
    console.log('list computed', v)
  })
  this.subscribe((v) => {
    console.log('target computed', v)
  })
  return res
}

export function SetValue(this: IList, value: Array<unknown>) {
  const needRecompute = value.length !== this.currentValue.length
  const max = Math.max(value.length, this.currentValue.length)
  for (let i = 0; i < max; i++) {
    const newItem = value[i]

    if (this.currentValue[i] && newItem) {
      if (isStatxFn(newItem)) {
        this.currentValue[i] = newItem as any
      } else {
        this.currentValue[i].set(newItem)
      }
    } else if (newItem === undefined) {
      this.currentValue.splice(i, this.currentValue.length)
      break
    } else if (this.currentValue[i] === undefined) {
      if (isStatxFn(newItem)) {
        this.currentValue[i] = newItem as any
        console.warn('Don use signals in list items. Values already reactive.')
      } else {
        //@ts-expect-error
        this.currentValue[i] = state(newItem, {name: this.name + '.' + i})
      }
    }
  }
  //Recompute root computed value only if length changed
  console.log('Recompute', needRecompute)
  if (needRecompute) {
    notify(this, this.currentValue)
  }
}
