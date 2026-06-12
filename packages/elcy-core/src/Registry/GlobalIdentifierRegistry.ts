import { Enumerable } from "@elcy/enumerable";

const globalIdentifierRegistry = new Map<string, unknown>([
    // Global Function
    ["parseInt", parseInt],
    ["parseFloat", parseFloat],
    ["decodeURI", decodeURI],
    ["decodeURIComponent", decodeURIComponent],
    ["encodeURI", encodeURI],
    ["encodeURIComponent", encodeURIComponent],
    ["isNaN", isNaN],
    ["isFinite", isFinite],
    ["eval", eval],

    // Fundamental Objects
    ["Object", Object],
    ["Function", Function],
    ["Boolean", Boolean],
    ["Symbol", Symbol],

    // Constructor/ Type
    ["Error", Error],
    ["Number", Number],
    ["BigInt", BigInt],
    ["Math", Math],
    ["Date", Date],
    ["String", String],
    ["RegExp", RegExp],
    ["Array", Array],
    ["Map", Map],
    ["Set", Set],
    ["WeakMap", WeakMap],
    ["WeakSet", WeakSet],
    ["ArrayBuffer", ArrayBuffer],
    ["Uint8Array", Uint8Array],
    ["Uint16Array", Uint16Array],
    ["Uint32Array", Uint32Array],
    ["Int8Array", Int8Array],
    ["Int16Array", Int16Array],
    ["Int32Array", Int32Array],
    ["Uint8ClampedArray", Uint8ClampedArray],
    ["Float32Array", Float32Array],
    ["Float64Array", Float64Array],
    ["DataView", DataView],

    // Value
    ["Infinity", Infinity],
    ["NaN", NaN],
    ["undefined", undefined],
    ["null", null],
    ["true", true],
    ["false", false],

    // data model
    ["Enumerable", Enumerable]
]);
export const GlobalIdentifierMap: ReadonlyMap<string, unknown> = globalIdentifierRegistry;
export const register = (identifier: string, value: unknown) => {
    globalIdentifierRegistry.set(identifier, value);
};
