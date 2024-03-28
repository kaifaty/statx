import type {TValues} from './types.js'

export function getValue(key: string, values: TValues): string | undefined {
  const path: string[] = key.split('.')
  let v: string | number | TValues | undefined = values
  for (const subkey of path) {
    v = v[subkey]
    if (typeof v !== 'object') break
  }
  if (v === undefined) return undefined
  return v.toString()
}

export const setDocumentLang = (value: string) => {
  if (typeof window !== 'undefined') {
    document?.querySelector('html')?.setAttribute('lang', value)
  }
}

export const replaceValues = (value: string, data: TValues): string => {
  return value.replace(/\$\{([a-zA-Z0-9_.,=)(: ]+)\}/g, (m: string, n: string) => {
    const value = getValue(n, data)
    if (value) {
      return value
    }
    return m
  })
}
