/* eslint-disable @typescript-eslint/no-explicit-any */
import type {State, AsyncStateOptions, Computed, AsyncState} from '../types'
import {state} from './state'
import {getNewFnWithName} from '../helpers/utils.js'
import type {IAsync, AsyncStatus} from '../helpers'
import {Peek, Subscribe, nonce, status} from '../helpers'
import {computed} from './computed'
import {GetStateValue, SetValue} from './proto-state'
import {OnDepsChange, Stop, Start, IsMaxWait, Then} from './proto-async'

export const AsyncStateProto = Object.create(null)

AsyncStateProto.get = GetStateValue
AsyncStateProto.onDepsChange = OnDepsChange
AsyncStateProto.peek = Peek
AsyncStateProto.set = SetValue
AsyncStateProto.start = Start
AsyncStateProto.stop = Stop
AsyncStateProto.subscribe = Subscribe
AsyncStateProto.isMaxWait = IsMaxWait
AsyncStateProto.then = Then

export function asyncState<TResponse>(
  fn: (controller: AbortController, prevValue: TResponse | undefined) => Promise<TResponse>,
  deps: Array<State<any> | Computed<any>>,
  options?: AsyncStateOptions<TResponse>,
): AsyncState<TResponse> {
  const id = nonce.get()
  const AsyncState: IAsync = getNewFnWithName(options, 'asyncState:' + id)

  Object.setPrototypeOf(AsyncState, AsyncStateProto)
  status.initStatus(id, AsyncState, 'async')

  defaultParams: {
    AsyncState._fn = fn as any
    AsyncState._timeRequestStart = 0
    AsyncState._frameId = 0
    AsyncState._isStarted = false
  }

  initParams: {
    AsyncState.maxWait = options?.maxWait ?? 0
    AsyncState.strategy = options?.strategy ?? 'last-win'
    AsyncState.strategyDelay = options?.strategyDelay ?? 0

    AsyncState.customDeps = deps as any
    AsyncState.undefinedOnError = options?.undefinedOnError ?? false
  }

  initStatusParams: {
    const asyncDeps = [AsyncState]
    AsyncState.isPending = state(false, {name: 'isPending::' + AsyncState.id}) as any
    AsyncState.error = state<undefined | Error>(undefined, {name: 'error::' + AsyncState.id}) as any
    AsyncState.status = computed<AsyncStatus>(
      () => {
        if (AsyncState.isPending()) {
          return 'pending'
        }
        if (AsyncState.error()) {
          return 'error'
        }
        if (!AsyncState._isStarted) {
          return 'pause'
        }
        return 'idle'
      },
      {name: 'status::' + AsyncState.id},
    ) as any
    AsyncState.isPending.customDeps = asyncDeps
    AsyncState.error.customDeps = asyncDeps
    AsyncState.status.customDeps = asyncDeps
    AsyncState.isPending.asyncDep = true
    AsyncState.error.asyncDep = true
    AsyncState.status.asyncDep = true
  }

  if (options?.initialValue !== undefined) {
    AsyncState.set(options.initialValue)
  }

  if (options?.activateOnCreate ?? true) {
    AsyncState.start()
  }

  return AsyncState as any
}
