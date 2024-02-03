import type {IComputed} from './type'

class Requester {
  MAX_DEEP = 100
  level = -1
  private requester: Array<IComputed> = Array.from({length: this.MAX_DEEP})
  push(value: IComputed) {
    if (this.level > this.MAX_DEEP) {
      throw new Error('Max calculation deep is 100')
    }
    this.requester.push(value)
  }
  pop() {
    const value = this.requester.pop()
    return value
  }
  peek() {
    return this.requester[this.requester.length - 1]
  }
}

export const requester = new Requester()
