import {state} from './build/index.js'

const data = []
for (let i = 0; i < 10000; i++) {
  data.push(state(i))
}

console.log(globalThis.process?.memoryUsage?.().heapUsed)
