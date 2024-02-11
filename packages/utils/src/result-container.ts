export class Result<TRes, TErr> {
  value: TRes | undefined
  error: TErr | undefined
  ok: boolean
  constructor(data: {ok: boolean; value: TRes; error: TErr} | Result<TRes, TErr>) {
    this.value = data.value
    this.error = data.error
    this.ok = data.ok
  }
  static success<T, E>(value: T) {
    return new Result<T, E>({ok: true, value, error: undefined as E})
  }
  static failure<E, T>(error: E) {
    return new Result<T, E>({ok: false, value: undefined as T, error})
  }
  bind<T extends (value: TRes) => unknown>(fn: T) {
    return this.ok ? fn(this.value as TRes) : new Result(this)
  }
  match(handleValue: (value: TRes) => unknown, handleError?: (value: TErr) => unknown) {
    return this.ok ? handleValue(this.value as TRes) : handleError?.(this.error as TErr)
  }
}
