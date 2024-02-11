import {events} from '@statx/core'
import {NodesMap} from './nodes-map'

export const openVisualizer = (
  visualizerPath = '/visualizer.html',
  windowFeatures = 'popup=1; width=1100px; height=700px;',
) => {
  events.setEnabled(true)
  if (window.visualizer) {
    return
  }

  const win = window.open(visualizerPath, '_blank', windowFeatures)

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
