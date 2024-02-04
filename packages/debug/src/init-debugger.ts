import {events} from '@statx/core'
import {DebugElement} from './view/debug-element'
import {NodesMap} from './nodes-map'

export const initSeparateDebugger = (
  debuggerPath = '/debug.html',
  windowFeatures = 'popup=1; width=1100px; height=700px;',
) => {
  events.setEnabled(true)
  const win = window.open(debuggerPath, '_blank', windowFeatures)
  if (!win) {
    console.error('Cant create child window')
    return
  }
  win.nodesMap = new NodesMap()
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
    nodesMap: NodesMap
    events: typeof events
  }
}
