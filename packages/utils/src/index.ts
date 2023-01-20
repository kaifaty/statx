export const createMockFn = () => {}

export const throttled = /*#__PURE__*/ <F extends (...args: any[]) => any>(time: number, df: F): F => {
  let timer: any
  let lastArgs: any[]
  let lastCall = 0

  const f = ((...args) => {
    const currtime = Date.now()
    const diffTime = currtime - lastCall
    if (diffTime < time) {
      df(...args)
      lastCall = currtime
    } else {
      lastArgs = args
      if (!timer) {
        timer = setTimeout(() => {
          df(lastArgs)
          timer = null
        }, diffTime)
      }
    }
  }) as F

  return f
}
