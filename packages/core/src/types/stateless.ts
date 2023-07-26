import type {ComputedInternalOptions, Nullable, StateType} from './types.js'

export type StatlessFunc<T extends StateType> = (v: T) => T

export type GetStatlessFunc<
  T extends StateType,
  S extends StatlessFunc<T>,
  O extends Nullable<ComputedInternalOptions<T>>,
> = T extends -1
  ? O extends undefined
    ? StatlessFunc<StateType<T>>
    : S extends () => infer K
    ? () => K
    : NonNullable<O>['initial'] extends undefined
    ? (v: unknown) => unknown
    : StatlessFunc<StateType<NonNullable<O>['initial']>>
  : StatlessFunc<StateType<T>>
