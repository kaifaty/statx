/* eslint-disable @typescript-eslint/no-explicit-any */

import {createTextId, hashCode} from './utils'
import {getNodeUpdaters, type NodeUpdater} from './updaters'
import {HTMLResult} from './HTMLResult'

type HTMLTemplateFunction = (strings: TemplateStringsArray, ...values: Array<unknown>) => HTMLResult

const concatString = (strings: TemplateStringsArray, values: Array<any>) => {
  const len = strings.length
  let contentString = ''
  for (let i = 0; i < len; i++) {
    contentString += strings[i]
    if (values[i] !== undefined) {
      contentString += createTextId(i)
    }
  }
  return contentString
}

const getRoot = (textContent: string, hash: string): DocumentFragment => {
  const existResult = HTMLResult.cacheNodes.get(hash)

  if (existResult) {
    return existResult.cloneNode(true) as DocumentFragment
  }

  const t = document.createElement('template')
  t.innerHTML = textContent

  const root = t.content

  HTMLResult.cacheNodes.set(hash, root as DocumentFragment)

  return root.cloneNode(true) as DocumentFragment
}

const createWalker = (root: DocumentFragment) => {
  return document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT, {
    acceptNode(node) {
      if (node.nodeType === 1 && (node as Element).hasAttributes() == false) {
        return NodeFilter.FILTER_SKIP
      }
      return NodeFilter.FILTER_ACCEPT
    },
  })
}

const collectNodes = (walker: TreeWalker, values: Array<unknown>): Array<NodeUpdater> => {
  const nodes: Array<Node> = []

  while (walker.nextNode()) {
    nodes.push(walker.currentNode)
  }
  const updaters: Array<NodeUpdater> = []

  nodes.forEach((node) => {
    getNodeUpdaters(node as Element | Comment, values).forEach((updater) => {
      updaters.push(updater)
    })
  })
  return updaters
}

export const html: HTMLTemplateFunction = (strings, ...values) => {
  const textContent = concatString(strings, values)
  const hash = hashCode(textContent)
  const root = getRoot(textContent, hash)
  const walker = createWalker(root)
  const nodes = collectNodes(walker, values)

  return new HTMLResult(walker.root as DocumentFragment, nodes, hash, values)
}

export const render = (content: unknown, target: Element | ShadowRoot) => {
  if (content instanceof HTMLResult) {
    target.innerHTML = ''
    target.append(...content.root)
  } else if (content instanceof Node) {
    target.replaceChildren(content)
  } else {
    target.innerHTML = String(content)
  }
}
