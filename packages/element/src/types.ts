/* eslint-disable @typescript-eslint/no-explicit-any */
export type PropertyData = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  type: boolean | string | Object | string[]
  attrbute?: boolean
  reflect?: boolean
  onChange?: (ctx: any, value: any) => void
}

export type Properties = {
  [key: string]: PropertyData
}

export type Constructor<T> = new (...args: any[]) => T
