import {
  stateLocalStorage,
  stateSessionStorage,
  indexeddbStorage,
  SyncPersistState,
  AsyncPersistState,
} from '../index.js'

const logElement = document.getElementById('log')

const createWatcher = (storage: SyncPersistState<string> | AsyncPersistState<string>) => {
  const element = document.getElementById(storage.name) as HTMLInputElement
  const button = document.getElementById('clear-' + storage.name) as HTMLButtonElement

  storage.subscribe((v) => {
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
const dd = indexeddbStorage('initial', {
  name: 'idb',
  throttle: 500,
})
