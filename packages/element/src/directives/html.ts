import {html as coreHtml, svg as coreSvg, type TemplateResult} from 'lit/html.js'

import {isStatxFn} from '@statx/core'

import {watch} from './watch'

const withWatch =
  (coreTag: typeof coreHtml | typeof coreSvg) =>
  (strings: TemplateStringsArray, ...values: unknown[]): TemplateResult => {
    return coreTag(
      strings,
      ...values.map((v) => {
        return isStatxFn(v) ? watch(v as any) : v
      }),
    )
  }

export const html = withWatch(coreHtml)
export const svg = withWatch(coreSvg)
