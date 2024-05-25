/* eslint-disable @typescript-eslint/no-explicit-any */
import {dependencyTypes, stateTypes} from './status'
import type {
  CommonInternal,
  DependencyType,
  IAsync,
  IComputed,
  IState,
  ILinkedList,
  INode,
  ListenerInternal,
  NodeType,
} from './type.js'
import type {Computed, Func, Options, State} from '../types/types.js'
const names = new Set()

const replaceKeyWithValues = <T extends Record<string, unknown>>(data: T) => {
  return Object.entries(data).reduce((acc, item) => {
    //@ts-ignore
    acc[item[1]] = item[0] as DependencyType
    return acc
  }, {})
}
const dependencyObject = replaceKeyWithValues(dependencyTypes) as Record<number, DependencyType>
const statesObject = replaceKeyWithValues(stateTypes) as Record<number, NodeType>

export const eachDependency = (
  node: CommonInternal,
  cb: (node: CommonInternal | ListenerInternal, type: DependencyType) => void,
) => {
  if (!node.deps) {
    return
  }
  let current = node.deps.head
  while (current) {
    cb(current.value, dependencyObject[current.type])
    current = current.next
  }
}

export class Node<T> implements INode<T> {
  next?: INode<T>
  prev?: INode<T>

  constructor(
    public value: T,
    public type: number,
  ) {}
}

export class LinkedList<T> implements ILinkedList<T> {
  head?: INode<T>
  tail?: INode<T>
  length: number
  constructor(value: T, type: number) {
    this.head = new Node<T>(value, type)
    this.tail = this.head
    this.length = 1
  }
  push(value: T, type: number) {
    const newNode = new Node<T>(value, type)
    if (!this.head) {
      this.head = newNode
      this.tail = newNode
    } else {
      const prev = this.tail
      this.tail = newNode
      prev!.next = newNode
      newNode.prev = prev
    }
    this.length++
    return this
  }
  remove(node: Node<T>) {
    if (node === this.tail) {
      if (node.prev) {
        this.tail = node.prev
        node.prev.next = undefined
      } else {
        this.head = undefined
        this.tail = undefined
      }
    } else if (node === this.head) {
      if (node.next) {
        this.head = node.next
        node.next.prev = undefined
      } else {
        this.head = undefined
        this.tail = undefined
      }
    } else {
      node.prev!.next = node.next
      node.next!.prev = node.prev
    }
    this.length--
    return this
  }
  find(value: T): INode<T> | undefined {
    let current = this.head
    while (current) {
      if (current.value === value) {
        return current
      }
      current = current.next
    }
    return undefined
  }
  clear() {
    this.head = undefined
    this.tail = undefined
    this.length = 0
  }
}

export const getNodeType = (node: CommonInternal): NodeType => {
  return statesObject[node.type]
}
export const getDependencyType = (type: number): DependencyType => {
  return dependencyObject[type]
}

export const getName = (name?: string, defaultName = 'withoutName'): string => {
  if (name && names.has(name)) {
    console.error(`[Name error]: ${name} already used! Replaced to undefined`)
    return defaultName
  }
  if (name) {
    return name
  }
  return defaultName
}

export const assert = (condition: boolean, msg: string) => {
  if (condition) {
    throw new Error(msg)
  }
}

export const isFunction = (v: unknown): v is Func => {
  return typeof v === 'function'
}

export const isStatxFn = (v: unknown): v is CommonInternal => {
  return typeof v === 'function' && Object.hasOwn(v, 'id')
}

export function isState(v: unknown): v is IState {
  return isStatxFn(v) && v.type === stateTypes.state
}

export function isComputed(v: unknown): v is IComputed {
  return isStatxFn(v) && v.type === stateTypes.computed
}
export function isList(v: unknown): v is IComputed {
  return isStatxFn(v) && v.type === stateTypes.list
}

export function isAsyncComputed(v: unknown): v is IAsync {
  return isStatxFn(v) && v.type === stateTypes.async
}

export function isListener(v: unknown): v is ListenerInternal {
  return typeof v === 'function' && 'base' in v
}

export const getNewFnWithName = (options?: Options, defaultName?: string) => {
  const name = getName(options?.name, defaultName)
  //@ts-ignore
  function Node() {
    //@ts-ignore
    return Node.get()
  }
  //@ts-ignore
  Node[Symbol.toPrimitive] = () => {
    //@ts-ignore
    return Node.get()
  }

  Object.defineProperty(Node, 'name', {
    value: name,
  })
  return Node as any
}

export const asInternal = (state: State<any> | Computed<any>): CommonInternal => {
  return state as any as CommonInternal
}
