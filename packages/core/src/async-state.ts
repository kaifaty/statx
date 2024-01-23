/* eslint-disable @typescript-eslint/no-explicit-any */
import type {State, AsycStateOptions, Computed} from './types'
import {state} from './state'
import {getNewFnWithName, getNonce, stateTypes} from './utils.js'
import {
  GetStateValue,
  Peek,
  SetValue,
  Subscribe,
  OnDepsChange,
  Start,
  Stop,
  Then,
  IsMaxWait,
  IAsync,
  AsyncStatus,
} from './proto'
import {computed} from './computed'
import {addState} from './states-map'

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

// TODO statages 'fist-win' | 'first&last-win'
// TODO isPending isLoaded

export type TAsyncState<T> = State<T | undefined> & {
  start(): void
  stop(): void
  isLoading: State<boolean>
  error: State<Error | undefined>
  /**
   * Pause: when async state was not started or when stoped
   * Pending: when state start processing
   * idle: when state was start and before or after pending
   *
   */
  status: Computed<AsyncStatus>
}

export function asyncState<TResponse>(
  fn: (controller: AbortController) => Promise<TResponse>,
  deps: Array<State<any> | Computed<any>>,
  options?: AsycStateOptions<TResponse>,
): TAsyncState<TResponse> {
  const id = getNonce()
  const AsyncState: IAsync = getNewFnWithName(options, 'asyncState_' + id)

  Object.setPrototypeOf(AsyncState, AsyncStateProto)

  AsyncState._fn = fn
  AsyncState._listeners = new Set()
  AsyncState._id = id

  AsyncState._hasParentUpdates = false
  AsyncState._isStarted = false
  AsyncState._type = stateTypes.async

  AsyncState._timeRequestStart = 0
  AsyncState._maxWait = options?.maxWait ?? 0
  AsyncState._frameId = 0
  AsyncState._strategy = options?.stratagy ?? 'last-win'
  AsyncState._undefinedOnError = options?.undefinedOnError ?? false
  AsyncState._customDeps = deps as any

  const asyncDeps = [AsyncState]
  AsyncState.isPending = state(false, {name: 'isPending::' + AsyncState._id})
  AsyncState.error = state<undefined | Error>(undefined, {name: 'error::' + AsyncState._id})
  AsyncState.status = computed<AsyncStatus>(
    () => {
      if (AsyncState._isStarted) {
        return 'pause'
      }
      if (AsyncState.isPending()) {
        return 'pending'
      }
      if (AsyncState.error()) {
        return 'error'
      }
      return 'indle'
    },
    {name: 'status::' + AsyncState._id},
  )
  AsyncState.isPending._customDeps = asyncDeps
  AsyncState.error._customDeps = asyncDeps
  AsyncState.status._customDeps = asyncDeps

  if (!options?.initial) {
    AsyncState.set(options?.initial)
  }

  if (options?.autoStart ?? true) {
    AsyncState.start()
  }

  addState(AsyncState)
  return AsyncState as any
}
