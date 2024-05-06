import {isStatxFn} from '@statx/core'
import type {NodeUpdater} from './types'
import {HTMLResult} from '../HTMLResult'

export class CommentUpdater implements NodeUpdater {
  private unsub?: () => void
  private insertedLen = 0
  private wasInitialRender = 0
  private commentStartNode?: Comment
  private parent: Element
  constructor(
    private commentEndNode: Comment,
    private value: unknown,
  ) {
    this.parent = commentEndNode.parentElement!
    Promise.resolve().then(() => this.subscribe())
  }

  private unwrapValue(rawValue: unknown) {
    if (isStatxFn(rawValue)) {
      return rawValue.get?.()
    } else {
      return rawValue
    }
  }

  private parseValue(value: unknown): Node | Array<Node> {
    this.insertedLen++
    if (value instanceof Element) {
      return value
    }
    if (value instanceof HTMLResult) {
      return value.root
    }
    return document.createTextNode(String(value))
  }

  private collectResult(result: Array<Node>, value: unknown) {
    value = this.unwrapValue(value)
    const res = this.parseValue(value)

    if (Array.isArray(res)) {
      res.forEach((node) => result.push(node))
    } else {
      result.push(res)
    }
  }

  private getNodesToInsert(value: unknown) {
    value = this.unwrapValue(value)
    const result: Array<Node> = []
    if (Array.isArray(value)) {
      value.forEach((item) => {
        this.collectResult(result, item)
      })
    } else {
      this.collectResult(result, value)
    }
    return result
  }

  private firstRender(nodesToInsert: Node[]) {
    if (this.wasInitialRender === 0) {
      const fr = document.createDocumentFragment()
      this.commentStartNode = document.createComment('start')
      fr.append(this.commentStartNode, ...nodesToInsert)
      this.parent.insertBefore(fr, this.commentEndNode)
      this.wasInitialRender = 1
      return
    }
  }

  private nextRenders(nodesToInsert: Node[], prevResult: number) {
    const NEW_LIST_LENGTH = this.insertedLen
    let PREV_LIST_LENGTH = prevResult
    let MAX_INDEX = Math.max(NEW_LIST_LENGTH, PREV_LIST_LENGTH)

    let current: ChildNode | null = this.commentStartNode?.nextSibling ?? null

    for (let i = 0; i < MAX_INDEX; i++) {
      const nodeToUpdate: Node | undefined = nodesToInsert[i]
      if (!current) {
        console.warn(`[NodeUpdateError]: Cannot find current node to compare`)
        break
      }

      /**
       * Insert new nodes
       */
      if (NEW_LIST_LENGTH > PREV_LIST_LENGTH && i >= PREV_LIST_LENGTH) {
        this.parent.insertBefore(nodeToUpdate, this.commentEndNode)
        current = nodeToUpdate as ChildNode
        continue
      }

      if (current === this.commentEndNode) {
        console.error(`[NodeUpdateError]: Current node is Comment end`)
        break
      }

      /**
       * Remove old nodes
       */
      if (NEW_LIST_LENGTH < PREV_LIST_LENGTH) {
        if (i >= NEW_LIST_LENGTH) {
          const next = current.nextSibling
          this.parent.removeChild(current)
          current = next as ChildNode | null
          continue
        }
        if (nodeToUpdate?.nodeType === 1 && current?.nodeType === 1 && nodeToUpdate !== current) {
          const next = current.nextSibling
          const currSaved = current
          if (next === nodeToUpdate) {
            Promise.resolve().then((r) => currSaved.remove())
            current = next
            PREV_LIST_LENGTH--
            MAX_INDEX--
          } else {
            current.replaceWith(nodeToUpdate)
            current = nodeToUpdate.nextSibling
          }
          continue
        }
      }

      /**
       * Update text nodes
       */
      if (nodeToUpdate.nodeType === 3 && current.nodeType === 3) {
        if (nodeToUpdate.textContent !== current.textContent) {
          current.textContent = nodeToUpdate.textContent
        }
      }
      current = current.nextSibling
    }
  }

  private render(value: unknown): void {
    const prevResult = this.insertedLen
    this.insertedLen = 0
    const nodesToInsert = this.getNodesToInsert(value)

    if (!this.parent) {
      console.error('[NodeRenderError]: Cant find parent node')
      return
    }

    if (this.wasInitialRender === 0) {
      this.firstRender(nodesToInsert)
    } else {
      this.nextRenders(nodesToInsert, prevResult)
    }
  }

  subscribe(): void {
    this.unSubscribe()

    this.render(this.value)
    if (isStatxFn(this.value)) {
      this.unsub = this.value.subscribe(() => {
        this.render(this.value)
      })
    }
  }

  unSubscribe(): void {
    this.unsub?.()
    this.unsub = undefined
  }
}
