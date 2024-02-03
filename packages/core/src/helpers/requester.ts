import type {IComputed} from './type'

class Requester {
  MAXDEEP = 100
  level = -1
  private requester: Array<IComputed> = Array.from({length: this.MAXDEEP})
  push(value: IComputed) {
    if (this.level > this.MAXDEEP) {
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
