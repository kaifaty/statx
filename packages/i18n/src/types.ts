/* eslint-disable @typescript-eslint/no-unused-vars */
export interface ITranslationStorage {
  [key: string]: string | ITranslationStorage
}
export interface TValues {
  [key: string]: string | number | TValues
}

export interface IReplacers {
  [key: string]: (key: string) => string
}

type TranslationUnit = Partial<{[key in Lang]: string}>

export type ParseString<T extends string | undefined> = T extends undefined
  ? never
  : T extends `${infer _}\${${infer variable}}${infer E}`
  ? variable | ParseString<E>
  : T extends `${infer _}\${${infer variable}}`
  ? variable
  : T extends `\${${infer variable}}`
  ? variable
  : never

type ReplaceString<
  T extends {[key in string]: string},
  Key extends string,
> = Key extends `${infer B}\${${infer val}}${infer E}`
  ? val extends keyof T
    ? `${B}${T[val]}${E}`
    : `${B}\${${val}}${E}`
  : never

export type TransStore = Readonly<{
  [key in string]: Readonly<TranslationUnit>
}>

export type PickValues<
  T extends TransStore,
  K extends keyof T,
  L extends Lang,
  Res = {
    [key in ParseString<T[K][L]>]: string
  },
> = {
  [key in ParseString<T[K][L]>]: string
}

export type I18nResult<
  T extends TransStore,
  K extends keyof T,
  L extends Lang,
  Vals extends PickValues<T, K, L> | undefined = undefined,
> = T[K][L] extends string ? (Vals extends PickValues<T, K, L> ? ReplaceString<Vals, T[K][L]> : T[K][L]) : K

export type Lang =
  | 'ab'
  | 'aa'
  | 'af'
  | 'ak'
  | 'sq'
  | 'am'
  | 'ar'
  | 'an'
  | 'hy'
  | 'as'
  | 'av'
  | 'ae'
  | 'ay'
  | 'az'
  | 'bm'
  | 'ba'
  | 'eu'
  | 'be'
  | 'bn'
  | 'bh'
  | 'bi'
  | 'bs'
  | 'br'
  | 'bg'
  | 'my'
  | 'ca'
  | 'km'
  | 'ch'
  | 'ce'
  | 'ny'
  | 'zh'
  | 'cu'
  | 'cv'
  | 'kw'
  | 'co'
  | 'cr'
  | 'hr'
  | 'cs'
  | 'da'
  | 'dv'
  | 'nl'
  | 'dz'
  | 'en'
  | 'eo'
  | 'et'
  | 'ee'
  | 'fo'
  | 'fj'
  | 'fi'
  | 'fr'
  | 'ff'
  | 'gd'
  | 'gl'
  | 'lg'
  | 'ka'
  | 'de'
  | 'ki'
  | 'el'
  | 'kl'
  | 'gn'
  | 'gu'
  | 'ht'
  | 'ha'
  | 'he'
  | 'hz'
  | 'hi'
  | 'ho'
  | 'hu'
  | 'is'
  | 'io'
  | 'ig'
  | 'id'
  | 'ia'
  | 'ie'
  | 'iu'
  | 'ik'
  | 'ga'
  | 'it'
  | 'ja'
  | 'jv'
  | 'kn'
  | 'kr'
  | 'ks'
  | 'kk'
  | 'rw'
  | 'kv'
  | 'kg'
  | 'ko'
  | 'kj'
  | 'ku'
  | 'ky'
  | 'lo'
  | 'la'
  | 'lv'
  | 'lb'
  | 'li'
  | 'ln'
  | 'lt'
  | 'lu'
  | 'mk'
  | 'mg'
  | 'ms'
  | 'ml'
  | 'mt'
  | 'gv'
  | 'mi'
  | 'mr'
  | 'mh'
  | 'ro'
  | 'mn'
  | 'na'
  | 'nv'
  | 'nd'
  | 'ng'
  | 'ne'
  | 'se'
  | 'no'
  | 'nb'
  | 'nn'
  | 'ii'
  | 'oc'
  | 'oj'
  | 'or'
  | 'om'
  | 'os'
  | 'pi'
  | 'pa'
  | 'ps'
  | 'fa'
  | 'pl'
  | 'pt'
  | 'qu'
  | 'rm'
  | 'rn'
  | 'ru'
  | 'sm'
  | 'sg'
  | 'sa'
  | 'sc'
  | 'sr'
  | 'sn'
  | 'sd'
  | 'si'
  | 'sk'
  | 'sl'
  | 'so'
  | 'st'
  | 'nr'
  | 'es'
  | 'su'
  | 'sw'
  | 'ss'
  | 'sv'
  | 'tl'
  | 'ty'
  | 'tg'
  | 'ta'
  | 'tt'
  | 'te'
  | 'th'
  | 'bo'
  | 'ti'
  | 'to'
  | 'ts'
  | 'tn'
  | 'tr'
  | 'tk'
  | 'tw'
  | 'ug'
  | 'uk'
  | 'ur'
  | 'uz'
  | 've'
  | 'vi'
  | 'vo'
  | 'wa'
  | 'cy'
  | 'fy'
  | 'wo'
  | 'xh'
  | 'yi'
  | 'yo'
  | 'za'
  | 'zu'
