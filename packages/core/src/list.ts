/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Listner, Options, PublicList} from './types/index.js'
import {getNounce} from './proto/proto-base.js'
import {At, Pop, Push, Shift, Sort, UnShift} from './proto/proto-list.js'
import {StateProto} from './state.js'
import {getName} from './utils.js'

const ListProto = Object.assign(Object.create(null), StateProto)

ListProto.sort = Sort
ListProto.at = At
ListProto.shift = Shift
ListProto.unshift = UnShift
ListProto.pop = Pop
ListProto.push = Push

export const list = <T extends Array<unknown>>(value: T, options?: Options) => {
  //@ts-ignore
  const List = () => List.get()

  Object.setPrototypeOf(List, ListProto)

  List._childs = Object.create(null)
  List._parents = Object.create(null)
  List._id = getNounce()
  List._subscribes = [] as Array<Listner>

  Object.defineProperty(List, 'name', {
    value: getName(options?.name),
    configurable: false,
    writable: false,
  })

  //@ts-ignore
  List.set(value)

  return List as any as PublicList<T>
}
