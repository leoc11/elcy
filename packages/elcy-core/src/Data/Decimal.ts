import type { Decimal as DecimalModule } from "decimal.js";

declare global {
    interface DecimalValueTypeRegistry {
        Decimal: Decimal;
    }
}

let module: typeof import("decimal.js").default;

try {
    module = (await import("decimal.js")).default;
}
catch { }

export const Decimal = module;
export type Decimal = DecimalModule;
