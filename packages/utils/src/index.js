export const throttled = /*#__PURE__*/ (time, df) => {
    let timer;
    let lastArgs;
    let lastCall = 0;
    const f = ((...args) => {
        const currtime = Date.now();
        const diffTime = currtime - lastCall;
        if (diffTime > time) {
            df(...args);
            lastCall = currtime;
        }
        else {
            lastArgs = args;
            if (!timer) {
                timer = setTimeout(() => {
                    f(lastArgs);
                    timer = null;
                }, diffTime);
            }
        }
    });
    return f;
};
//# sourceMappingURL=index.js.map