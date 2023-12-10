/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Listner, UnSubscribe} from './types/index.js'
import {assert, createPublic} from './utils.js'
import {ComputedInternal, SetterFunc} from './types/index.js'
import {Common} from './common.js'
import type {StateType} from './types/index.js'
import {isFunction} from './utils.js'
import {Computed, ComputedInternalOptions, GetStatlessFunc, Nullable, StatlessFunc} from './types/index.js'

export class ComputedX extends Common implements ComputedInternal {
  initial?: unknown
  isComputing: boolean = false
  reducer: SetterFunc

  constructor(value: SetterFunc, options?: ComputedInternal) {
    super(options)
    this.reducer = value as SetterFunc
    this.initial = options?.initial
  }

  subscribe(listner: Listner): UnSubscribe {
    // Нужно актуализировать в родилеях зависимость
    this.computeValue()

    Object.values<Common>(this._parents).forEach((parent) => (parent._childs[this._id] = this))
    return super.subscribe(listner)
  }
  get() {
    try {
      this._updateDeps()
      return this.computeValue()
    } finally {
      Common.recording?.add(this)
    }
  }

  private isDontNeedRecalc(): boolean {
    return this._hasParentUpdates === false && this.peek !== undefined
  }

  private computeValue(): unknown {
    try {
      if (this.isDontNeedRecalc()) {
        const rec = Common.recording
        if (rec) {
          Object.values<Common>(this._parents).forEach((item) => rec?.add(item))
        }
        return this.peek
      }

      assert(this.isComputing, `Loops dosen't allows. Name: ${this.name ?? 'Unnamed state'}`)

      Common.requesters.push(this)
      Object.values<Common>(this._parents).forEach((item) => {
        delete item._childs[this._id]
        delete this._parents[item._id]
      })

      this.isComputing = true
      const value = this.reducer(this.peek ?? this.initial)
      this.isComputing = false
      this._hasParentUpdates = false

      Common.requesters.pop()
      this._pushHistory(value)

      return value
    } catch (e) {
      console.error(`Error in computed name: ${this.name}. Message: ${(e as Error).message}`)
      this.isComputing = false
      return undefined
    }
  }
}

export const computed = <
  T extends StateType = -1,
  S extends StatlessFunc<T> = StatlessFunc<T>,
  O extends Nullable<ComputedInternalOptions<T, S>> = Nullable<ComputedInternalOptions<T, S>>,
>(
  value: GetStatlessFunc<T, S>,
  options?: O,
): Computed<T> => {
  assert(!isFunction(value), 'In computed must be functions only')

  return createPublic(new ComputedX(value as SetterFunc, options as ComputedInternal)) as Computed<T>
}
