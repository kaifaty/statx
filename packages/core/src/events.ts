import type {CommonInternal} from './proto'

type ValueListener = (base: CommonInternal) => void
type CommonListener = () => void

class EventsX {
  valueListeners: Array<ValueListener> = []
  commonListeners: Array<CommonListener> = []

  dispatchValueUpdate(base: CommonInternal) {
    this.valueListeners.forEach((l) => l(base))
  }
  dispatchUpdate() {
    this.commonListeners.forEach((l) => l())
  }
  onUpdateValue(listener: ValueListener) {
    this.valueListeners.push(listener)
    return () => {
      this.valueListeners = this.valueListeners.filter((item) => item !== listener)
    }
  }
  onUpdate(listener: CommonListener) {
    this.commonListeners.push(listener)
    return () => {
      this.commonListeners = this.commonListeners.filter((item) => item !== listener)
    }
  }
}

export const events = new EventsX()
