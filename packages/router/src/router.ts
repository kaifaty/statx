/* eslint-disable @typescript-eslint/no-explicit-any */
import {url} from '@statx/url'

const origin = location.origin || location.protocol + '//' + location.host

type Entry = () => Promise<boolean> | boolean
type RenderFn = (outer?: RenderFn) => unknown
type ChildParams = {
  render: RenderFn
  name: string
  entry?: Entry
}
type InitParams = Omit<ChildParams, 'name'> & {
  injectSelector: string
}

async function* gen(data: string[]) {
  while (data.length) {
    yield data.shift() as string
  }
}

class Routes {
  private static rootNode: Routes | undefined
  private static hiddenSymbol = Symbol()
  static errorFallback = () => {
    return `Oops, page dont exist`
  }
  static renderFunction = <T extends any>(data: T, containter: any) => {
    containter.innerHTML = String(data)
  }
  private static rootElement: Element | undefined
  private static parsePath(path: string) {
    const pathArray = path.split('/').filter(Boolean)
    return pathArray
  }
  static initRoot({injectSelector, render, entry}: InitParams) {
    this.rootElement = document.querySelector(injectSelector) ?? undefined
    this.rootNode = new this(this.hiddenSymbol, '/', render, entry)
    return this.rootNode
  }
  static async goto(path: string): Promise<boolean> {
    const pathData = this.parsePath(path)
    let current = this.rootNode
    const stack = [current]

    for await (const name of gen(pathData)) {
      const existNode = current?.childred.find((node) => node.name === name)
      if (!existNode) {
        // warning + error fallback
        console.warn(name, 'not exist')

        break
      }
      const entryResult = await existNode.entry?.()
      if (entryResult === false) {
        console.warn(name, 'entry is not allowed')
        return false
      }
      stack.push(existNode)
      current = existNode
    }
    const lastNode = stack.pop()
    const renderResult = lastNode?.render()
    this.renderFunction(renderResult, this.rootElement)
    return true
  }

  private childred: Routes[] = []
  constructor(
    symbol: symbol,
    public readonly name = '/',
    private renderFn: RenderFn,
    private entry?: Entry,
    private parent?: Routes,
  ) {
    if (symbol !== this.cnstr.hiddenSymbol) {
      throw new Error('Create new route with static initRoot or addChild functions')
    }
  }
  render(outerFn?: () => string): unknown {
    if (this.parent) {
      return this.parent?.render(() => this.renderFn(outerFn) as any)
    }
    return this.renderFn(outerFn)
  }
  addChild({name, render, entry}: ChildParams) {
    const child = new this.cnstr(Routes.hiddenSymbol, name, render, entry, this)
    this.childred.push(child)
    return child
  }
  get cnstr() {
    return this.constructor as any
  }
}

export class Router extends Routes {
  private static unsub?: () => void
  static start(): void {
    this.unsub = url.path.subscribe((path) => this.goto(path))
    this.goto(url.path())
    window.addEventListener('click', this._onClick)
  }
  static stop() {
    this.unsub?.()
    window.removeEventListener('click', this._onClick)
  }
  static async goto(path: string) {
    const result = await super.goto(path)
    if (result !== false) {
      url.push(path)
    }
    return result
  }

  private static _onClick = (e: MouseEvent) => {
    const isNonNavigationClick = e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey
    if (e.defaultPrevented || isNonNavigationClick) {
      return
    }

    const anchor = e.composedPath().find((n) => (n as HTMLElement).tagName === 'A') as
      | HTMLAnchorElement
      | undefined
    if (
      anchor === undefined ||
      anchor.target !== '' ||
      anchor.hasAttribute('download') ||
      anchor.getAttribute('rel') === 'external'
    ) {
      return
    }

    const href = anchor.href
    if (href === '' || href.startsWith('mailto:')) {
      return
    }

    const location = window.location
    if (anchor.origin !== origin) {
      return
    }

    e.preventDefault()
    if (href !== location.href) {
      this.goto(anchor.pathname)
    }
  }
}
