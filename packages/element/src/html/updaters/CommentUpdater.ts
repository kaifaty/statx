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
    private commentNode: Comment,
    private value: unknown,
  ) {
    this.parent = commentNode.parentElement!
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
    /**
     * First update
     */
    if (this.wasInitialRender === 0) {
      const fr = document.createDocumentFragment()
      this.commentStartNode = document.createComment('start')
      fr.append(this.commentStartNode, ...nodesToInsert)
      this.parent.insertBefore(fr, this.commentNode)
      this.wasInitialRender = 1
      return
    }
  }

  private nextRenders(nodesToInsert: Node[], prevResult: number) {
    const NEW_LIST_LENGTH = this.insertedLen
    const PREV_LIST_LENGTH = prevResult
    const MIN_INDEX = Math.min(NEW_LIST_LENGTH, PREV_LIST_LENGTH)

    let current: ChildNode | null = this.commentStartNode?.nextSibling ?? null

    /**
     * 1. Update existed DOM state
     */
    for (let i = 0; i < MIN_INDEX; i++) {
      const nodeToUpdate = nodesToInsert[i]

      if (!current) {
        console.warn(`[NodeUpdateError]: Cannot find current node to compare`)
        break
      }

      if (!nodeToUpdate) {
        console.warn(`[NodeUpdateError]: Cannot find nodeToUpdate`, {
          i,
          MIN_INDEX,
          NEW_LIST_LENGTH,
          PREV_LIST_LENGTH,
          nodesToInsert,
        })
        break
      }

      /**
       * Update text nodes if needed
       */
      if (nodeToUpdate.nodeType === 3 && current.nodeType === 3) {
        if (nodeToUpdate.textContent !== current.textContent) {
          current.textContent = nodeToUpdate.textContent
        }
      } else if (nodeToUpdate !== current) {
        /**
         * Update Elements nodes if needed
         */
        const next = current.nextSibling

        current.remove()
        this.parent.insertBefore(nodeToUpdate, next)
        current = (nodeToUpdate as ChildNode) ?? null
      } else {
        //console.warn('[UNHANDLED UPDATE CASE]')
      }

      current = current?.nextSibling
    }

    /**
     * 2.Remove old nodes
     */
    if (PREV_LIST_LENGTH > NEW_LIST_LENGTH) {
      for (let i = NEW_LIST_LENGTH; i < PREV_LIST_LENGTH; i++) {
        const next = current?.nextSibling

        if (!current) {
          console.warn(`[NodeRemoveError]: Cannot find current node to remove`)
          break
        }
        this.parent.removeChild(current)

        current = next as ChildNode | null
      }
    }

    /**
     * 3.Insert new nodes
     */
    if (NEW_LIST_LENGTH > PREV_LIST_LENGTH) {
      for (let i = PREV_LIST_LENGTH; i < NEW_LIST_LENGTH; i++) {
        const nodeToUpdate = nodesToInsert[i]

        if (nodeToUpdate === undefined) {
          console.warn(`[NodeInsertError]: Cannot find nodeToUpdate`, {i, NEW_LIST_LENGTH, PREV_LIST_LENGTH})
          break
        }

        this.parent.insertBefore(nodeToUpdate, this.commentNode)
      }
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
