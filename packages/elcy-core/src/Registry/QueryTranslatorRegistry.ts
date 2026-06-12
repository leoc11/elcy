import type { DbType } from "src/Common/StringType";
import type { QueryTranslator } from "../Query/QueryTranslator";

type TranslatorType = DbType | "default";
const translationFunctionMap = new Map<TranslatorType, Array<(translator: QueryTranslator) => void>>();
const translatorMap = new Map<TranslatorType, QueryTranslator>();
export const registerTranslationFunction = (type: TranslatorType, fn: (translator: QueryTranslator) => void) => {
    const translator = translatorMap.get(type);
    if (translator) {
        fn(translator);
        return;
    }

    let translationFns = translationFunctionMap.get(type);
    if (!translationFns) {
        translationFns = [];
        translationFunctionMap.set(type, translationFns);
    }

    translationFns.push(fn);
}
export const registerTranslator = (type: TranslatorType, translator: QueryTranslator) => {
    if (translatorMap.has(type)) {
        throw "unexpected";
    }

    translatorMap.set(type, translator);
    const translationFns = translationFunctionMap.get(type);
    if (!translationFns) {
        return;
    }

    translationFunctionMap.delete(type);
    for (const init of translationFns) {
        init(translator);
    }
}