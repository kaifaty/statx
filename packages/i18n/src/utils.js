export function getValue(key, values) {
    const path = key.split('.');
    let v = values;
    for (const subkey of path) {
        v = v[subkey];
        if (typeof v !== 'object')
            break;
    }
    if (v === undefined)
        return undefined;
    return v.toString();
}
export const setDocumentLang = (value) => {
    document?.querySelector('html')?.setAttribute('lang', value);
};
export const replaceValues = (value, data) => {
    return value.replace(/\$\{([a-zA-Z0-9_.,=)(: ]+)\}/g, (m, n) => {
        const value = getValue(n, data);
        if (value) {
            return value;
        }
        return m;
    });
};
//# sourceMappingURL=utils.js.map