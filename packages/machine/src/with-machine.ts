/* eslint-disable @typescript-eslint/no-explicit-any */
import type {StateMachine, ServiceFrom} from '@xstate/fsm'
import {interpret} from '@xstate/fsm'

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
  createMachine<T extends StateMachine.AnyMachine>(
    machineFabric: () => T,
    options?: MachineOptions,
  ): () => ServiceFrom<T>
}

type MachineOptions = {
  clearOnConnect: boolean
}

type StoreItem = {
  machineFabric: () => StateMachine.AnyMachine
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
    createMachine<T extends StateMachine.AnyMachine>(
      machineFabric: () => T,
      options?: MachineOptions,
    ): () => ServiceFrom<T> {
      const list = store.get(this) ?? []
      const machine = machineFabric()
      const item = {
        machineFabric,
        service: interpret(machine),
        options,
        machine,
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
          item.machine = item.machineFabric()
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
