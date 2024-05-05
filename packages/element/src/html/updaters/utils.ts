import {AttrUpdater} from './AttrUpdater'
import {CommentUpdater} from './CommentUpdater'
import type {NodeUpdater} from './types'

export {AttrUpdater} from './AttrUpdater'
export {CommentUpdater} from './CommentUpdater'

export const getNodeUpdaters = (element: Element | Comment, values: Array<unknown>): Array<NodeUpdater> => {
  const nodeUpdaters: Array<NodeUpdater> = []

  if (element.nodeType === Node.ELEMENT_NODE) {
    const attrs = [...(element as Element).attributes]
    for (const attr of attrs) {
      const value = getValue(attr.value, values)
      if (value !== undefined) {
        const attrUpdater = new AttrUpdater(attr, values)
        nodeUpdaters.push(attrUpdater)
      }
    }
  } else if (element.nodeType === Node.COMMENT_NODE) {
    const value = getValue(element.textContent ?? '', values)
    const commentUpdater = new CommentUpdater(element as Comment, value)
    nodeUpdaters.push(commentUpdater)
  }

  return nodeUpdaters
}

const getValue = (content: string, values: Array<unknown>): unknown | undefined => {
  return values[getID(content)]
}

export const getID = (content: string): number => {
  const parsedID = content.split('id:')?.[1]?.split('--')[0]
  if (parsedID === undefined) {
    return -1
  }
  return Number(parsedID)
}
