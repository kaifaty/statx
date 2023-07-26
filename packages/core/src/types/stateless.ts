export type StatlessFunc<T> = (v: T) => T

type Res<T, S extends StatlessFunc<T>> = T extends -1 ? ReturnType<S> : T

export type GetStatlessFunc<T, S extends StatlessFunc<T>> = StatlessFunc<Res<T, S>>

export type ComputedInternalOptions<T, S extends StatlessFunc<T>> = {
  name?: string
  initial?: Res<T, S>
}
