import {getStatesMap, events, getStateByName, setLogsEnabled} from '@statx/core'
import {DebugElement} from './view/debug-element'

export const initSeparateDebugger = (
  debuggerPath = '/debug.html',
  windowFeatures = 'popup=1; width=1100px; height=700px;',
) => {
  setLogsEnabled(true)
  const win = window.open(debuggerPath, '_blank', windowFeatures)
  if (!win) {
    console.error('Cant create child window')
    return
  }
  win.getStatesMap = getStatesMap
  win.getStateByName = getStateByName
  win.events = events

  window.addEventListener('beforeunload', () => {
    win.close()
  })
}

export const initDebugger = () => {
  DebugElement.define()
}

declare global {
  interface Window {
    getStatesMap: typeof getStatesMap
    getStateByName: typeof getStateByName
    events: typeof events
  }
}
