/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Options, PublicList} from './types/index.js'
import {At, Pop, Push, Shift, Sort, UnShift} from './proto'
import {StateProto} from './state.js'
import {getNewFnWithName, getNonce, stateTypes} from './utils.js'
import {addState} from './states-map.js'

const ListProto = Object.assign(Object.create(null), StateProto)

ListProto.sort = Sort
ListProto.at = At
ListProto.shift = Shift
ListProto.unshift = UnShift
ListProto.pop = Pop
ListProto.push = Push

export const list = <T extends Array<unknown>>(value: T, options?: Options) => {
  const id = getNonce()
  const List = getNewFnWithName(options, 'list_' + id)

  Object.setPrototypeOf(List, ListProto)

  List._id = id
  List._type = stateTypes.list
  List._listeners = new Set()

  addState(List)

  List.set(value)

  return List as any as PublicList<T>
}
