import type {CommonInternal} from './type'

class Recorder {
  value: Set<CommonInternal> | undefined = undefined
  start() {
    this.value = new Set()
  }
  add(node: CommonInternal) {
    this.value?.add(node)
  }
  get() {
    return this.value
  }
  flush() {
    const value = this.value
    this.value = undefined
    return value
  }
}

export const recorder = new Recorder()
