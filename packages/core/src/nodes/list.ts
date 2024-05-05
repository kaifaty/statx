/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Options, PublicList} from '../types/index.js'
import {Peek, Subscribe, nonce, status} from '../helpers/index.js'
import {At, Pop, Push, Shift, IndexOf, Splice, Sort, Map, SetValue, UnShift} from './proto-list.js'
import {getNewFnWithName} from '../helpers/utils.js'
import {GetStateValue} from './proto-state.js'

const ListProto = Object.create(null)

ListProto.sort = Sort
ListProto.at = At
ListProto.shift = Shift
ListProto.unshift = UnShift
ListProto.pop = Pop
ListProto.push = Push
ListProto.map = Map
ListProto.set = SetValue
ListProto.get = GetStateValue
ListProto.peek = Peek
ListProto.subscribe = Subscribe
ListProto.splice = Splice
ListProto.indexOf = IndexOf

export const list = <T extends Array<unknown>>(value: T, options?: Options) => {
  const id = nonce.get()
  const List = getNewFnWithName(options, 'list_' + id)

  Object.setPrototypeOf(List, ListProto)
  status.initStatus(id, List, 'list')

  List.currentValue = []
  List.set(value)

  return List as any as PublicList<T>
}
