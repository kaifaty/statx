/* eslint-disable @typescript-eslint/no-explicit-any */
import type {State, AsycStateOptions, Computed} from '../types'
import {state} from './state'
import {getNewFnWithName} from '../utils.js'
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
  status,
} from '../helpers'
import {computed} from './computed'

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

export type AsyncState<T> = State<T | undefined> & {
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
): AsyncState<TResponse> {
  const id = nonce.get()
  const AsyncState: IAsync = getNewFnWithName(options, 'asyncState:' + id)

  Object.setPrototypeOf(AsyncState, AsyncStateProto)
  status.initStatus(id, AsyncState, 'async')

  defaultParams: {
    AsyncState._fn = fn
    AsyncState._timeRequestStart = 0
    AsyncState._frameId = 0
    AsyncState._isStarted = false
  }

  initParams: {
    AsyncState.maxWait = options?.maxWait ?? 0
    AsyncState.strategy = options?.strategy ?? 'last-win'
    AsyncState.customDeps = deps as any
    AsyncState.undefinedOnError = options?.undefinedOnError ?? false
  }

  initStatusParams: {
    const asyncDeps = [AsyncState]
    AsyncState.isPending = state(false, {name: 'isPending::' + AsyncState.id})
    AsyncState.error = state<undefined | Error>(undefined, {name: 'error::' + AsyncState.id})
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
        return 'idle'
      },
      {name: 'status::' + AsyncState.id},
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

  return AsyncState as any
}
