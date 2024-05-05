export type WCStyleSheet = CSSStyleSheet | string

export const supportsAdoptingStyleSheets =
  globalThis.ShadowRoot && 'adoptedStyleSheets' in Document.prototype && 'replace' in CSSStyleSheet.prototype

/**
 * Create css styles
 */
export const createStyle = (styles: string): WCStyleSheet => {
  if (supportsAdoptingStyleSheets) {
    const result = new CSSStyleSheet()
    result.replaceSync(styles)
    return result
  }
  return styles
}

/**
 * Adoption styles to element
 */
export const adoptToElement = (element: HTMLElement, styles: WCStyleSheet[] | WCStyleSheet) => {
  if (!Array.isArray(styles)) {
    styles = [styles]
  }
  if (!styles.length) {
    return
  }
  if (typeof styles[0] === 'string') {
    styles.forEach((s) => {
      const v = document.createElement('style')
      v.textContent = s as string
      element.appendChild(v)
    })
  } else {
    if (element.shadowRoot) {
      element.shadowRoot.adoptedStyleSheets = [
        ...new Set([...element.shadowRoot.adoptedStyleSheets, ...(styles as CSSStyleSheet[])]),
      ]
    } else {
      throw new Error('No shadow root')
    }
  }
}

const concat = (strings: TemplateStringsArray, values: string[]) => {
  const len = strings.length
  let acc = ''
  for (let i = 0; i < len; i++) {
    acc += strings[i]?.replace(/(\n)(\r)/g, '')
    if (values[i] !== undefined) {
      acc += values[i]
    }
  }
  return acc
}

export const css = (strings: TemplateStringsArray, ...values: string[]) => {
  const string = concat(strings, values)
  return createStyle(string)
}
