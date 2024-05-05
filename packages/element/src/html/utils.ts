let nonce = 0

export const getNonce = () => nonce++

export function hashCode(str: string) {
  const len = str.length
  let hash = 0
  let i = 0
  while (i < len) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) << 0
    i = i + 1
  }
  return String(hash + 2147483647 + 1)
}

export const createTextId = (id: number | string) => {
  return '<!--$id:' + id + '-->'
}

export const AttrTypes = {
  ATTR: 0,
  BOOLEAN_ATTR: 1,
  PROPERTY: 2,
  HANDLER: 3,
}
