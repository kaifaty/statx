/* eslint-disable @typescript-eslint/no-explicit-any */

type Func = (...args: any[]) => any
type Promises<T> = (value: PromiseLike<T>) => void

export const throttle = <F extends Func>(
  f: F,
  time: number,
): ((...args: Parameters<F>) => Promise<ReturnType<F>>) => {
  let lastCall = 0
  let timer: NodeJS.Timeout | number = 0

  const promises: Promises<ReturnType<F>>[] = []

  return (...args: any[]) => {
    return new Promise<ReturnType<F>>((r) => {
      const currtime = Date.now()
      const diffTime = currtime - lastCall

      if (diffTime > time || lastCall === 0) {
        r(f(...args))
        lastCall = currtime
        return
      }
      promises.push(r)
      if (timer) {
        return
      }
      timer = setTimeout(() => {
        const data = f(...args)
        promises.forEach((r) => r(data))
        timer = 0
        lastCall = currtime
      }, time)
    })
  }
}
