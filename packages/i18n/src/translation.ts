import {state} from '@statx/core'
import type {I18nResult, Lang, PickValues, TransStore} from './types.js'
import {replaceValues, setDocumentLang} from './utils.js'

export const createI18n = <const T extends TransStore, L extends Lang>(data: T, lang: L) => {
  const langState = state<Lang>(lang)
  setDocumentLang(lang)

  const setLang = (value: Lang) => {
    langState.set(value)
    setDocumentLang(value)
  }
  const i18n = <K extends keyof T, const V extends PickValues<T, K, L>>(
    key: K,
    values: V | undefined = undefined,
  ): I18nResult<T, K, L, V> => {
    const value = data[key]?.[langState()]

    if (!value) {
      return key as I18nResult<T, K, L, V>
    }
    if (!values) {
      return value as I18nResult<T, K, L, V>
    }

    return replaceValues(value, data) as I18nResult<T, K, L, V>
  }

  const res = {
    store: () => data,
    geLang: () => langState(),
    setLang,
    i18n,
  }
  return res
}
