/* eslint-disable @typescript-eslint/no-explicit-any */
import {nonce} from './nonce'
import type {CommonInternal} from './type'

type CommonListener = () => void

type Event = keyof EventMap
type EventMap = {
  NodeCreate: CommonInternal
  ValueUpdate: CommonInternal
  ListenerUpdate: CommonListener
}
type Listeners = {
  type: Event
  listener: (...args: any[]) => void
}

class Events {
  listeners: Listeners[] = []
  enabled = false

  setEnabled(value: boolean) {
    if (nonce.peek() > 0) {
      console.warn('SET LOGS ENABLE BEFORE ANY STATE OR COMPUTED BEEN CREATE')
    }
    this.enabled = value
  }
  dispatchEvent<T extends Event>(event: T, value: EventMap[T]) {
    this.listeners.forEach((item) => {
      if (item.type === event) {
        item.listener(value)
      }
    })
  }
  on<T extends Event>(event: T, listener: (value: EventMap[T]) => void) {
    this.listeners.push({
      type: event,
      listener,
    })
    return () => {
      this.listeners = this.listeners.filter((item) => {
        return item.type === event && item.listener === listener
      })
    }
  }
}

export const events = new Events()
