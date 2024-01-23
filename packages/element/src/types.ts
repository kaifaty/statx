export type PropertyData = {
  //@ts-ignore
  type: Boolean | String | Object | string[]
  attrbute?: boolean
  reflect?: boolean
  onChange?: (ctx: any, value: any) => void
}

export type Properties = {
  [key: string]: PropertyData
}

export type Constructor<T> = new (...args: any[]) => T
