export type XMLParser = import("fast-xml-parser").XMLParser;
let module: typeof import("fast-xml-parser").XMLParser;
try {
    module = (await import('fast-xml-parser')).XMLParser;
}
catch { }

export const XMLParser = module;