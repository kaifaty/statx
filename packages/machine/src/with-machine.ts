import type {StateMachine, ServiceFrom} from '@xstate/fsm'
import {interpret} from '@xstate/fsm'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Constructor<T> = new (...args: any[]) => T

type WithRequsetUpdate = {
  requestUpdate(): void
}

export interface IMachinable {
  initMachenes<T extends StateMachine.AnyMachine>(machine: T): ServiceFrom<T>
}

type UnSubscribe = () => void

const subscribes_ = Symbol()
const interpres_ = Symbol()

export const withMachine = <T extends Constructor<HTMLElement & WithRequsetUpdate>>(
  Element: T,
): T & Constructor<IMachinable> => {
  return class Machinable extends Element {
    [interpres_]: StateMachine.AnyService[] = [];
    [subscribes_]: UnSubscribe[] = []

    initMachenes<T extends StateMachine.AnyMachine>(machine: T): ServiceFrom<T> {
      const service = interpret(machine)
      this[interpres_].push(service)
      return service as ServiceFrom<T>
    }

    connectedCallback() {
      //@ts-ignore
      super.connectedCallback?.()
      this[interpres_].forEach((item) => {
        item.start()
        const subResult = item.subscribe(() => super.requestUpdate())
        this[subscribes_].push(subResult.unsubscribe)
      })
    }

    disconnectedCallback() {
      //@ts-ignore
      super.disconnectedCallback?.()
      this[interpres_].forEach((item) => item.stop())
      this[subscribes_].forEach((item) => item())
    }
  }
}
