import "./EnumerableExtension";

declare global {
    interface SymbolConstructor {
        readonly arrayItemType: symbol;
    }
    interface Array<T> {
        /**
         * Use to determine item type of an array. Especially required for Array Value Parameter in query.
         * Example 1: newArray[Symbol.arrayItemType] = Number.
         * Example 2: newArray[Symbol.arrayItemType] = { constructor: Object, NumberProperty: Number, StringProperty: String }.
         */
        [Symbol.arrayItemType]?: any;
    }
}

(Symbol as any).arrayItemType = Symbol("ItemType");