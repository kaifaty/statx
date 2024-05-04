/* eslint-disable @typescript-eslint/no-explicit-any */

export type AnyFunc = (...args: any[]) => any
type Promises<T> = (value: PromiseLike<T>) => void

export const throttle = <F extends AnyFunc>(
  f: F,
  time: number,
): ((...args: Parameters<F>) => Promise<ReturnType<F>>) => {
  let lastCalcTime = 0
  let timer: NodeJS.Timeout | number = 0
  let lastArgs: any

  const promises: Promises<ReturnType<F>>[] = []

  return (...args: any[]) => {
    return new Promise<ReturnType<F>>((r) => {
      const currentTime = Date.now()
      const diffTime = currentTime - lastCalcTime
      lastArgs = args

      if (diffTime > time || lastCalcTime === 0) {
        r(f(...lastArgs))
        lastCalcTime = currentTime
        clearTimeout(timer)
        timer = 0
        return
      }
      promises.push(r)
      if (timer) {
        return
      }
      timer = setTimeout(() => {
        const data = f(...lastArgs)
        promises.forEach((r) => r(data))
        timer = 0
        lastCalcTime = currentTime
      }, time)
    })
  }
}
