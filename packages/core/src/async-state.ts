/* eslint-disable @typescript-eslint/no-explicit-any */
import type {Computed, State, AnyFunc} from './types'
import {state} from './state'
import {cancelFrame, startFrame} from './utils.js'

type Strategy = 'last-win' | 'fist-win' | 'first&last-win'

type AsycStateOptions<TResponse> = {
  /**
   * Initial state
   */
  initial?: TResponse

  /**
   * Default: last-win
   *
   * last-win - Classic debounce: cancel previouse request if new one comes in.
   * first-win - Skip new requests if already requseting
   * first-last - Awaits request complete, after that call's again if was deps changes.
   */
  stratagy?: Strategy

  /**
   * Default: 0. Zero meens unlimit wait
   */
  maxWait?: number
  /**
   * Default false. Auto start watching on props.
   */
  autoStart?: boolean

  /**
   * Default true. Execute async function on start
   */
  execOnStart?: boolean

  /**
   * Default false. Set state to undefined on error
   */
  undefinedOnError?: boolean

  name?: string
}

type RequestFn<TResponse> = (controller: AbortController) => Promise<TResponse>

export type TAsyncState<T> = State<T | undefined> & {
  start(): void
  stop(): void
  isLoading: State<boolean>
  error: State<Error | undefined>
}

class AsyncState<TResponse> {
  state: TAsyncState<TResponse>
  private strategy: Strategy
  private isStarted = false
  private frameId = 0
  private controller: AbortController | undefined
  private maxWait = 0
  private timeRequestStart = 0

  private options?: AsycStateOptions<TResponse>
  private unSubs: AnyFunc[] = []
  private fn: RequestFn<TResponse>

  constructor(
    fn: (controller: AbortController) => Promise<TResponse>,
    deps: (State<any> | Computed<any>)[],
    options?: AsycStateOptions<TResponse>,
  ) {
    this.options = options
    this.state = this.initState(options)
    this.fn = fn

    this.strategy = options?.stratagy ?? 'last-win'
    this.unSubs = deps.map((dep) => dep.subscribe(() => this.onDepsChange()))
    this.maxWait = options?.maxWait ?? 0

    if (options?.autoStart) {
      this.start()
    }
  }
  private initState<TResponse>(options?: AsycStateOptions<TResponse>): TAsyncState<TResponse> {
    const data = state<TResponse | undefined>(options?.initial, {name: options?.name})
    Object.defineProperty(data, 'isLoading', {
      writable: false,
      configurable: false,
      value: state(false),
    })
    Object.defineProperty(data, 'error', {
      writable: false,
      configurable: false,
      value: state(undefined),
    })
    Object.defineProperty(data, 'start', {
      writable: false,
      configurable: false,
      value: () => this.start(),
    })
    Object.defineProperty(data, 'stop', {
      writable: false,
      configurable: false,
      value: () => this.stop(),
    })
    return data as TAsyncState<TResponse>
  }

  private get isMaxWait() {
    if (this.maxWait) {
      console.log(Date.now() - this.timeRequestStart)
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

    if (this.strategy === 'last-win' && !this.isMaxWait && this.state.isLoading()) {
      this.controller?.abort('[NEW_CALL]: last-win strategy')
    }

    cancelFrame(this.frameId)

    this.frameId = startFrame(async () => {
      const controller = new AbortController()
      this.controller = controller
      const prevState = this.state()

      controller.signal.onabort = () => {
        this.timeRequestStart = Date.now()
        this.state.set(prevState)
      }

      try {
        this.state.isLoading.set(true)

        const response = await this.fn(controller)

        if (!controller.signal.aborted) {
          this.timeRequestStart = 0
          this.state.set(response)
          this.state.error.set(undefined)
        }
      } catch (e) {
        if (controller.signal.aborted) {
          this.state.error.set(e as Error)

          if (this.options?.undefinedOnError) {
            this.state.set(undefined)
          }
        }
      } finally {
        this.state.isLoading.set(false)
      }
    })
  }
  private start() {
    this.isStarted = true
    this.onDepsChange()
  }
  private stop() {
    this.isStarted = false
    this.unSubs.forEach((unSub) => unSub())
  }
}

export function asyncState<TResponse>(
  fn: (controller: AbortController) => Promise<TResponse>,
  deps: (State<any> | Computed<any>)[],
  options?: AsycStateOptions<TResponse>,
) {
  const asyncState = new AsyncState(fn, deps, options)
  return asyncState.state
}
