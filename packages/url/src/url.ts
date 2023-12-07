/* eslint-disable @typescript-eslint/no-explicit-any */
import {state} from '@statx/core'

const parseQueryParams = () => {
  let search = window.location.search
  if (search.startsWith('?')) {
    search = search.substring(1)
  }
  const result = search.split('&').reduce<Record<string, string>>((acc, item) => {
    const [key, value] = item.split('=')
    acc[key] = value
    return acc
  }, {})

  return result
}
const encodeQueryParams = (data: Record<string, string>) => {
  const entries = Object.entries(data)
  if (entries.length === 0) {
    return ''
  }
  return (
    `?` +
    entries
      .map((entry) => {
        return `${entry[0]}=${entry[1]}`
      })
      .join('&')
  )
}

class StateURL {
  readonly query = state<Record<string, string>>(parseQueryParams())
  readonly path = state(window.location.pathname)
  readonly hash = state(window.location.hash)
  readonly state = state<any>(undefined)

  constructor() {
    if (!globalThis.window) {
      throw new Error()
    }
    this.init()
  }
  private onLocationChange() {
    this.query.set(parseQueryParams())
    this.path.set(window.location.pathname)
    this.hash.set(window.location.hash)
  }
  private init() {
    globalThis.window.addEventListener('popstate', (e) => {
      this.state.set(e.state)
      this.onLocationChange()
    })
    globalThis.window.addEventListener('hashchange', () => {
      this.onLocationChange()
    })
  }
  private applyParam(data: Record<string, string>, replace: boolean) {
    if (replace) {
      this.replaceState(encodeQueryParams(data))
    } else {
      this.push(encodeQueryParams(data))
    }
  }
  deleteQueryParam(key: string, replace = false) {
    const data = {...this.query()}
    if (key in data) {
      delete data[key]
      this.applyParam(data, replace)
    }
  }
  addQueryParam(key: string, value: string, replace = false) {
    this.applyParam({...this.query(), [key]: value}, replace)
  }
  push(path: string, state?: any) {
    this.state.set(state)
    history.pushState(state, '', path)
    this.onLocationChange()
  }
  replaceState(path: string, state?: any) {
    this.state.set(state)
    history.replaceState(state, '', path)
    this.onLocationChange()
  }
  go(value?: number) {
    history.go(value)
    this.onLocationChange()
  }
  back() {
    history.back()
    this.onLocationChange()
  }
}

export const url = new StateURL()
