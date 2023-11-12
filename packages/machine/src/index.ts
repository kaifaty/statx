import {type State, state} from '@statx/core'
import {type StateMachine, interpret} from 'xstate'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class XStateX<T extends StateMachine<any, any, any, any, any>> {
  private statex: State<T['context']>

  constructor(
    public machene: T,
    public service = interpret(machene),
  ) {
    service.onTransition((state) => {
      this.statex.set({...state.context})
    })
    this.statex = state(machene.context)
    service.start()
  }
  get() {
    return this.statex()
  }
  send(...args: Parameters<typeof this.service.send>) {
    return this.service.send(...args)
  }
  start(...args: Parameters<typeof this.service.start>) {
    return this.service.start(...args)
  }
  subscribe(...args: Parameters<typeof this.statex.subscribe>) {
    return this.statex.subscribe(...args)
  }
}
