import type {events} from '@statx/core'
import {openVisualizer} from './open-visualizer'
import type {NodesMap} from './nodes-map'
import {styles} from './style.css'
import {VisualizerElement} from './view/visualizer-element'

const initVisualizer = () => {
  document.adoptedStyleSheets = [styles as CSSStyleSheet]
  VisualizerElement.define()
}

if (window.visualizer) {
  initVisualizer()
}

export {openVisualizer}

declare global {
  interface Window {
    nodesMap: NodesMap
    events: typeof events
    visualizer: boolean
  }
}
