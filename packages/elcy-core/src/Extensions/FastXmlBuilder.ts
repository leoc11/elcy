export type XMLBuilder = import("fast-xml-builder").XMLBuilder;
let module: typeof import("fast-xml-builder").default;
try {
    module = (await import('fast-xml-builder')).default;
}
catch { }

export const XMLBuilder = module;