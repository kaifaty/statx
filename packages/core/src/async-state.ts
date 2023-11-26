/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Computed, State, AnyFunc} from './types'
import {state} from './state'
import {cancelFrame, startFrame} from './utils.js'

type AsycState<T> = {
  data: T | undefined
  loading: boolean
  error: Error | undefined
}

type Strategy = 'last-win' | 'fist-win' | 'first&last-win'

type AsycStateOptions<TResponse> = {
  /**
   * Initial state
   */
  initial?: TResponse

  /**
   * last-win (default) - Classic debounce: cancel previouse request if new one comes in.
   * first-win - Skip new requests if already requseting
   * first-last - Awaits request complete, after that call's again if was deps changes.
   */
  stratagy?: Strategy
  maxWait?: number
}
type RequestFn<TResponse> = (controller: AbortController) => Promise<TResponse>

export class AsyncState<TResponse> {
  result: State<AsycState<TResponse>>
  initial: TResponse | undefined
  strategy: Strategy
  isStarted = false
  frameId = 0
  controller: AbortController | undefined
  maxWait = 0
  timeRequestStart = 0

  unSubs: AnyFunc[] = []
  fn: RequestFn<TResponse>

  constructor(
    fn: (controller: AbortController) => Promise<TResponse>,
    deps: (State<any> | Computed<any>)[],
    options?: AsycStateOptions<TResponse>,
  ) {
    this.fn = fn
    this.initial = options?.initial
    this.result = state<AsycState<TResponse>>({
      data: options?.initial,
      loading: false,
      error: undefined,
    })
    this.strategy = options?.stratagy ?? 'last-win'
    this.unSubs = deps.map((dep) => dep.subscribe(() => this.onDepsChange()))
    this.maxWait = options?.maxWait ?? 0
  }
  get isMaxWait() {
    if (this.maxWait) {
      return Date.now() - this.timeRequestStart > this.maxWait
    }
    return false
  }
  private onDepsChange() {
    // Skip when stoped
    if (!this.isStarted) {
      return
    }
    if (!this.timeRequestStart) {
      this.timeRequestStart = Date.now()
    }

    if (this.strategy === 'last-win' && !this.isMaxWait) {
      this.controller?.abort('[NEW_CALL]: last-win strategy')
    }
    cancelFrame(this.frameId)

    this.frameId = startFrame(async () => {
      this.controller = new AbortController()
      const prevState = this.result()

      this.controller.signal.onabort = () => {
        this.result.set(prevState)
      }
      try {
        this.result.set({
          ...prevState,
          loading: true,
        })

        const response = await this.fn(this.controller)
        if (!this.controller.signal.aborted) {
          this.timeRequestStart = 0
          this.result.set({
            data: response,
            error: undefined,
            loading: false,
          })
        }
      } catch (e) {
        if (!this.controller.signal.aborted) {
          this.result.set({
            error: e as Error,
            data: undefined,
            loading: false,
          })
        }
      }
    })
  }
  start() {
    this.isStarted = true
    this.onDepsChange()
  }
  stop() {
    this.isStarted = false
    this.unSubs.forEach((unSub) => unSub())
  }
}

export function asyncState<TResponse>(
  fn: (controller: AbortController) => Promise<TResponse>,
  deps: (State<any> | Computed<any>)[],
  options?: AsycStateOptions<TResponse>,
) {
  const res = new AsyncState(fn, deps, options)

  return {
    start: () => res.start(),
    stop: () => res.stop(),
    result: res.result,
  }
}
