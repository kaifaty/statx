/* eslint-disable @typescript-eslint/no-explicit-any */
import {list} from '@statx/core'
import {stateLocalStorage, stateSessionStorage, indexeddbStorage} from '../index.js'

const logElement = document.getElementById('log')

const createWatcher = (storage: any) => {
  const element = document.getElementById(storage.name) as HTMLInputElement
  const button = document.getElementById('clear-' + storage.name) as HTMLButtonElement

  storage.subscribe((v: any) => {
    element.value = v as any
    logElement?.insertAdjacentText(
      'beforeend',
      'Subscription of ' + storage.name + `. Value: ${v}. IsLoading: ` + storage.isLoading + '\n',
    )
  })
  element.value = storage()
  element.oninput = (e: Event) => storage.set((e.target as HTMLInputElement).value)
  button.onclick = () => storage.clear()
}

createWatcher(
  stateLocalStorage('initial', {
    name: 'local',
    throttle: 500,
  }),
)

createWatcher(
  stateSessionStorage('initial', {
    name: 'session',
    throttle: 500,
  }),
)

createWatcher(
  stateSessionStorage('initial', {
    name: 'idb',
    throttle: 500,
  }),
)

const testList = stateLocalStorage(list(['test']), {
  name: 'local-list',
  throttle: 500,
})
const testList2 = indexeddbStorage(list(['test']), {
  name: 'local-list',
  throttle: 500,
})
testList.subscribe((value) => {
  listElement.value = value.join(', ')
})

testList2.subscribe((value) => {
  console.log(value.join(', '))
})

const listElement = document.getElementById('list') as HTMLTextAreaElement

listElement.value = testList().join(', ')

document.getElementById('push-list')?.addEventListener('click', () => {
  testList.push(Math.random().toFixed(3))
})

document.getElementById('pop-list')?.addEventListener('click', () => {
  testList.pop()
})

document.getElementById('clear-list')?.addEventListener('click', () => {
  testList.clear()
})
