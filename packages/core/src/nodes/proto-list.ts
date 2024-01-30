/* eslint-disable @typescript-eslint/no-explicit-any */
import type {IList} from '../helpers/type.js'

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
