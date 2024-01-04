/* eslint-disable @typescript-eslint/no-explicit-any */
import {url} from '@statx/url'
import {state} from '@statx/core'

const origin = location.origin || location.protocol + '//' + location.host

type Entry = () => Promise<boolean> | boolean
type RenderFn = (outer?: RenderFn, query?: Record<string, string>) => unknown
type ChildParams = {
  render: RenderFn
  name: string
  entry?: Entry
  outlet?: () => void
}
type InitParams = Omit<ChildParams, 'name'> & {
  injectSelector: string
}
type GotoParams = {
  path: string
  query: Record<string, string>
  onInit?: boolean
}

let count = 0
let prevCheck = 0
let lastUpdate = 0

const loopCheck = () => {
  count++
  if (Date.now() - lastUpdate > 20) {
    if (count - prevCheck > 5) {
      throw new Error('Router loop')
    }
    prevCheck = count
    lastUpdate = Date.now()
  }
}

async function* gen(data: string[]) {
  while (data.length) {
    yield data.shift() as string
  }
}

const getPath = (_path: string) => {
  if (location.protocol === 'file:') {
    _path = _path.split('#')[1] ?? _path
  }

  const [path, query] = _path.split('?')
  const urlParams = new URLSearchParams(query)

  const queryParams = [...urlParams.entries()].reduce<Record<string, string>>((acc, v) => {
    acc[v[0]] = v[1]
    return acc
  }, {})

  return {path, query: queryParams}
}
const setPath = (path: string) => {
  if (location.protocol === 'file:') {
    return '#' + path
  }
  return path
}

class Routes {
  static maxHistoryLength = 10
  private static rootNode: Routes | undefined
  private static hiddenSymbol = Symbol()
  static history: Array<Router> = []
  static currentRoute = state<Routes | undefined>(undefined)
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
  static async __goto({path, query}: GotoParams): Promise<boolean> {
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
      stack.push(existNode)
      current = existNode
    }
    const lastNode = stack.pop()
    const entryResult = await lastNode?.entry?.()

    if (entryResult === false) {
      console.warn(lastNode?.name, 'entry is not allowed')
      return false
    }

    const renderResult = lastNode?.render(undefined, query)
    this.currentRoute.set(lastNode)
    if (lastNode) {
      this.history.push(lastNode)
      if (this.history.length > this.maxHistoryLength) {
        this.history.splice(0, 1)
      }
    }
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
  render(outerFn?: () => string, query?: Record<string, string>): unknown {
    if (this.parent) {
      return this.parent?.render(() => this.renderFn(outerFn, query) as any)
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
    this.unsub = url.path.subscribe((path) => this.goto(path, true))
    this.goto(url.path(), true)
    window.addEventListener('click', this._onClick)
  }
  static stop() {
    this.unsub?.()
    window.removeEventListener('click', this._onClick)
  }
  static async back() {
    if (this.history.length > 1) {
      const name = this.history[this.history.length - 2].name
      this.goto(name)
    }
  }
  static async goto(path: string, init = false) {
    loopCheck()
    const newPath = getPath(path)
    const currentPath = getPath(url.path())

    if (newPath.path === currentPath.path && !init) {
      return false
    }

    const result = await this.__goto(newPath)

    if (result !== false) {
      url.push(setPath(path))
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
      this.goto(anchor.getAttribute('href') ?? anchor.pathname)
    }
  }
}
