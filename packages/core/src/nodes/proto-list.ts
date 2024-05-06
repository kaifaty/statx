/* eslint-disable @typescript-eslint/no-explicit-any */
import type {CommonInternal, IList} from '../helpers/type.js'
import {computed} from './computed.js'
import {isStatxFn} from '../helpers/utils'
import {state} from './state.js'
import {notify} from './proto-state.js'
import type {Computed} from '../types/types'

const createMappedItem = (
  name: string,
  item: CommonInternal,
  fn: (valueState: CommonInternal) => unknown,
) => {
  return computed(() => fn(item), {name: name + `.mappedItem`})
}

export function Push(this: IList, ...args: Array<unknown>) {
  this.currentValue.push(...(args as any))
  this.maps?.forEach((mapItem) => {
    mapItem.data.push(...args.map((item) => mapItem.fn(item as any)))
  })
  return this.currentValue.length
}

export function UnShift(this: IList, ...args: Array<unknown>) {
  const res = this.currentValue.unshift()
  this.maps?.forEach((mapItem) => {
    mapItem.data.unshift(...args.map((item) => mapItem.fn(item as any)))
  })
  return res
}

export function Pop(this: IList) {
  return this.splice(-1)
}

export function Shift(this: IList) {
  return this.splice(0, 1)
}

export function At(this: IList, position: number) {
  const length = this.currentValue.length
  if (position < 0) {
    return this.currentValue[length + position]
  }
  return this.currentValue[position]
}

export function Sort(this: IList, fn?: (a: unknown, b: unknown) => number) {
  this.currentValue.sort(fn)
  notify(this, this.currentValue)
  return this.currentValue
}

export function Splice(this: IList, start: number, deleteCount?: number) {
  const res = this.currentValue.splice(start, deleteCount)
  this.maps?.forEach((mapItem) => {
    mapItem.data.splice(start, deleteCount)
  })
  notify(this, this.currentValue)
  return res
}

export function IndexOf(this: IList, item: CommonInternal) {
  return this.currentValue.indexOf(item as any)
}

export function Map(this: IList, fn: (valueState: CommonInternal) => unknown) {
  const mappedList: Array<Computed<unknown>> = this.currentValue.map((item) => {
    return createMappedItem(this.name, item as any, fn)
  })

  if (!this.maps) {
    this.maps = []
  }

  this.maps.push({
    fn,
    data: mappedList,
  })

  const res = computed(
    () => {
      this.get() as Array<CommonInternal>
      return mappedList
    },
    {name: this.name + '.map'},
  )

  return res
}

export function SetValue(this: IList, value: Array<unknown>) {
  const needRecompute = value.length !== this.prevLen
  const max = Math.max(value.length, this.currentValue.length)

  for (let i = 0; i < max; i++) {
    const newItem = value[i]

    if (this.currentValue[i] && newItem) {
      if (isStatxFn(newItem)) {
        this.currentValue[i] = newItem as any
        this.maps?.forEach((map) => {
          map.data[i] = createMappedItem(this.name, this.currentValue[i], map.fn)
        })
      } else {
        this.currentValue[i].set(newItem)
      }
    } else if (newItem === undefined) {
      this.splice(i, this.currentValue.length)
      break
    } else if (this.currentValue[i] === undefined) {
      if (isStatxFn(newItem)) {
        this.currentValue[i] = newItem as any
        console.warn('Don use signals in list items. Values already reactive.')
      } else {
        //@ts-expect-error
        this.currentValue[i] = state(newItem, {name: this.name + '.' + i})
      }
      this.maps?.forEach((map) => {
        map.data[i] = createMappedItem(this.name, this.currentValue[i], map.fn)
      })
    }
  }
  //Recompute root computed value only if length changed
  if (needRecompute) {
    notify(this, this.currentValue)
  }
  this.prevLen = this.currentValue.length
}
