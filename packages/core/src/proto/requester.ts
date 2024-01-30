import type {IComputed} from './type'

class Requester {
  private requester: Array<IComputed> = []
  push(value: IComputed) {
    this.requester.push(value)
  }
  pop() {
    return this.requester.pop()
  }
  peek() {
    return this.requester[this.requester.length - 1]
  }
  deep() {
    return this.requester.length
  }
}

export const requester = new Requester()
