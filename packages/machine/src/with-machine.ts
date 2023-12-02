/* eslint-disable @typescript-eslint/no-explicit-any */
import type {StateMachine, EventObject, Typestate, ServiceFrom} from '@xstate/fsm'
import {interpret, createMachine} from '@xstate/fsm'

type Constructor<T> = new (...args: any[]) => T

type WithRequsetUpdate = {
  requestUpdate(): void
}

type EventsC = {
  type: 'xstate.init' | string
  [key: string]: any
}
type UnSubscribe = () => void

export interface IMachinable {
  createMachine<TContext extends object, TEvent extends EventObject, TState extends Typestate<TContext>>(
    config: StateMachine.Config<TContext, TEvent, TState>,
    options?: MachineOptions,
  ): () => ServiceFrom<StateMachine.Machine<TContext, TEvent, TState>>
}

type MachineOptions = {
  clearOnConnect: boolean
}

type StoreItem = {
  config: StateMachine.Config<any, any, any>
  machine: StateMachine.AnyMachine
  service: StateMachine.AnyService
  options?: MachineOptions
  unSubscribe?: UnSubscribe
}

const store: WeakMap<any, StoreItem[]> = new WeakMap()

export const withMachine = <T extends Constructor<HTMLElement & WithRequsetUpdate>>(
  Element: T,
): T & Constructor<IMachinable> => {
  return class Machinable extends Element {
    createMachine<
      TContext extends object,
      TEvent extends EventObject,
      TState extends Typestate<TContext> = Typestate<TContext>,
    >(
      config: StateMachine.Config<TContext, TEvent, TState>,
      options?: MachineOptions,
    ): () => ServiceFrom<StateMachine.Machine<TContext, TEvent, TState>> {
      const machine = createMachine(config)
      const list = store.get(this) ?? []
      const item = {
        config,
        machine,
        service: interpret(machine),
        options,
      }
      list.push(item)
      store.set(this, list)

      return () => item.service as ServiceFrom<T>
    }

    connectedCallback() {
      //@ts-ignore
      super.connectedCallback?.()
      const list = store.get(this)
      list?.forEach((item) => {
        if (item.options?.clearOnConnect) {
          item.machine = createMachine(item.config)
          item.service = interpret(item.machine)
        }
        item.service.start()
        item.unSubscribe = item.service.subscribe(() => super.requestUpdate()).unsubscribe
      })
    }

    disconnectedCallback() {
      //@ts-ignore
      super.disconnectedCallback?.()

      const list = store.get(this)
      list?.forEach((item) => {
        item.service.stop()
        item.unSubscribe?.()
      })
    }
  }
}

export const action = <Ctx, Event extends EventsC>(
  fn: (ctx: Ctx, event: Event extends {type: 'xstate.init'} ? never : Event) => void,
) => {
  return (ctx: Ctx, event: Event) => {
    if (event.type !== 'xstate.init') {
      fn(ctx, event as any)
    }
  }
}
