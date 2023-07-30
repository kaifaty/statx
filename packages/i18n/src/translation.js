import { state } from '@statx/core';
import { replaceValues, setDocumentLang } from './utils.js';
export const createI18n = (data, lang) => {
    const langState = state(lang);
    setDocumentLang(lang);
    const setLang = (value) => {
        langState.set(value);
        setDocumentLang(value);
    };
    const i18n = (key, values) => {
        const value = data[key]?.[langState()];
        if (!value) {
            return key;
        }
        if (!values) {
            return value;
        }
        return replaceValues(value, data);
    };
    const res = {
        store: () => data,
        geLang: () => langState(),
        setLang,
        i18n,
    };
    return res;
};
//# sourceMappingURL=translation.js.map