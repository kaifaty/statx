/* eslint-disable @typescript-eslint/no-explicit-any */
import type {State, AsycStateOptions, Computed} from './types'
import {state} from './state'
import {getNewFnWithName} from './utils.js'
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
  nonce,
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
  const id = nonce.get()
  const AsyncState: IAsync = getNewFnWithName(options, 'asyncState:' + id)

  Object.setPrototypeOf(AsyncState, AsyncStateProto)

  defaultParams: {
    AsyncState._fn = fn
    AsyncState._id = id
    AsyncState._timeRequestStart = 0
    AsyncState._frameId = 0
    AsyncState._hasParentUpdates = false
    AsyncState._isStarted = false
  }

  initParams: {
    AsyncState.maxWait = options?.maxWait ?? 0
    AsyncState.strategy = options?.stratagy ?? 'last-win'
    AsyncState.customDeps = deps as any
    AsyncState.undefinedOnError = options?.undefinedOnError ?? false
  }

  initStatusParams: {
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
    AsyncState.isPending.customDeps = asyncDeps
    AsyncState.error.customDeps = asyncDeps
    AsyncState.status.customDeps = asyncDeps
  }

  if (options?.initial !== undefined) {
    AsyncState.set(options.initial)
  }

  if (options?.autoStart ?? true) {
    AsyncState.start()
  }

  addState(AsyncState)
  return AsyncState as any
}
