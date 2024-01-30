import type {IComputed} from './type'

class Requester {
  MAXDEEP = 100
  level = 0
  private requester: Array<IComputed> = Array.from({length: this.MAXDEEP})
  push(value: IComputed) {
    if (this.level > this.MAXDEEP) {
      throw new Error('Max calculation deep is 100')
    }
    this.requester[this.level++] = value
  }
  pop() {
    return this.requester[this.level--]
  }
  peek() {
    return this.requester[this.level]
  }
  deep() {
    return this.level
  }
}

export const requester = new Requester()
