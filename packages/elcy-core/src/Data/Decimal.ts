import type { Decimal as DecimalModule } from "decimal.js";
import { register } from "src/Registry/GlobalIdentifierRegistry";
import { registerTranslationFunction } from "src/Registry/QueryTranslatorRegistry";

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

if (module) {
    register("Decimal", Decimal);

    registerTranslationFunction("default", o => {
        o.registerValueType(Decimal, { columnType: { columnType: "decimal", option: { precision: 18, scale: 6 }, group: "Decimal" }, hydrate: (value: string | number) => new Decimal(String(value)), persist: (value) => value.toFixed(), queryValue: (value) => value.toFixed(), instance: new Decimal(0) });

        /**
         * Decimal
         * TODO: toSD, toSignificantDigits, static methods
         */
        o.registerConstructor(Decimal, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} as NUMERIC)`, o => o.params.length === 1);
        o.registerFn(Decimal, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} as NUMERIC)`, o => o.params.length === 1);
        o.registerMethod(Decimal.prototype, "plus", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}+${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "add", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}+${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "minus", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}-${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "sub", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}-${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "times", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}*${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "mul", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}*${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "div", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "dividedBy", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "pow", (qb, exp, context) => `POWER(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
        o.registerMethod(Decimal.prototype, "toPower", (qb, exp, context) => `POWER(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
        o.registerMethod(Decimal.prototype, "neg", (qb, exp, context) => `-${qb.toString(exp.objectOperand, context)}`);
        o.registerMethod(Decimal.prototype, "negated", (qb, exp, context) => `-${qb.toString(exp.objectOperand, context)}`);
        o.registerMethod(Decimal.prototype, "abs", (qb, exp, context) => `ABS(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "absoluteValue", (qb, exp, context) => `ABS(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "mod", (qb, exp, context) => `MOD(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
        o.registerMethod(Decimal.prototype, "modulo", (qb, exp, context) => `MOD(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
        o.registerMethod(Decimal.prototype, "sqrt", (qb, exp, context) => `SQRT(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "squareRoot", (qb, exp, context) => `SQRT(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "cbrt", (qb, exp, context) => `CBRT(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "cubeRoot", (qb, exp, context) => `CBRT(${qb.toString(exp.objectOperand, context)})`);

        o.registerMethod(Decimal.prototype, "eq", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}=${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "equals", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}=${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "lt", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "lessThan", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "lte", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<=${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "lessThanOrEqualTo", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<=${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "gt", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "greaterThan", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "gte", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>=${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "greaterThanOrEqualTo", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>=${qb.toString(exp.params[0], context)}`);

        o.registerMethod(Decimal.prototype, "round", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "floor", (qb, exp, context) => `FLOOR(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "ceil", (qb, exp, context) => `CEILING(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "trunc", (qb, exp, context) => `TRUNC(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "truncated", (qb, exp, context) => `TRUNC(${qb.toString(exp.objectOperand, context)})`);

        o.registerMethod(Decimal.prototype, "sin", (qb, exp, context) => `SIN(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "sine", (qb, exp, context) => `SIN(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "cos", (qb, exp, context) => `COS(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "cosine", (qb, exp, context) => `COS(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "tan", (qb, exp, context) => `TAN(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "tangent", (qb, exp, context) => `TAN(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "asin", (qb, exp, context) => `ASIN(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "inverseSine", (qb, exp, context) => `ASIN(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "acos", (qb, exp, context) => `ACOS(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "inverseCosine", (qb, exp, context) => `ACOS(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "atan", (qb, exp, context) => `ATAN(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "inverseTangent", (qb, exp, context) => `ATAN(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "sinh", (qb, exp, context) => `SINH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "hyperbolicSine", (qb, exp, context) => `SINH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "cosh", (qb, exp, context) => `COSH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "hyperbolicCosine", (qb, exp, context) => `COSH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "tanh", (qb, exp, context) => `TANH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "hyperbolicTangent", (qb, exp, context) => `TANH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "asinh", (qb, exp, context) => `ASINH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "inverseHyperbolicSine", (qb, exp, context) => `ASINH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "acosh", (qb, exp, context) => `ACOSH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "inverseHyperbolicCosine", (qb, exp, context) => `ACOSH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "atanh", (qb, exp, context) => `ATANH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "inverseHyperbolicTangent", (qb, exp, context) => `ATANH(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "exp", (qb, exp, context) => `EXP(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "naturalExponential", (qb, exp, context) => `EXP(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "ln", (qb, exp, context) => `LN(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "naturalLogarithm", (qb, exp, context) => `LN(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "log", (qb, exp, context) => `LOG(${qb.toString(exp.objectOperand, context)})`);
        o.registerMethod(Decimal.prototype, "logarithm", (qb, exp, context) => `LOG(${qb.toString(exp.objectOperand, context)})`);

        o.registerMethod(Decimal.prototype, "clamp", (qb, exp, context) => `LEAST(GREATEST(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)}), ${qb.toString(exp.params[1], context)})`);
        o.registerMethod(Decimal.prototype, "clampedTo", (qb, exp, context) => `LEAST(GREATEST(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)}), ${qb.toString(exp.params[1], context)})`);
        o.registerMethod(Decimal.prototype, "divToInt", (qb, exp, context) => `FLOOR(${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)})`);
        o.registerMethod(Decimal.prototype, "dividedToIntegerBy", (qb, exp, context) => `FLOOR(${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)})`);
        o.registerMethod(Decimal.prototype, "toDP", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)})`, o => o.params.length === 1);
        o.registerMethod(Decimal.prototype, "toDecimalPlaces", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)})`, o => o.params.length === 1);

        o.registerMethod(Decimal.prototype, "toNumber", (qb, exp, context) => `CAST(${qb.toString(exp.objectOperand, context)} as DOUBLE PRECISION)`);
        o.registerMethod(Decimal.prototype, "toNearest", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)})*${qb.toString(exp.params[0], context)}`);
        o.registerMethod(Decimal.prototype, "toPrecision", (qb, exp, context) => {
            const ob = qb.toString(exp.objectOperand, context);
            const paramQ = exp.params.length ? qb.toString(exp.params[0], context) : "0";
            return `CASE WHEN ${ob}=0 THEN 0
ELSE ROUND(${ob}, ${paramQ} - FLOOR(LOG(10, ABS(${ob}))) - 1)
END`;
        });
        o.registerMethod(Decimal.prototype, "cmp", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            const paramQ = qb.toString(exp.params[0], context);
            return `CASE WHEN ${obQ}<${paramQ} THEN -1 WHEN ${obQ}>${paramQ} THEN 1 ELSE 0 END`;
        }, o => o.params.length === 1);
        o.registerMethod(Decimal.prototype, "comparedTo", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            const paramQ = qb.toString(exp.params[0], context);
            return `CASE WHEN ${obQ}<${paramQ} THEN -1 WHEN ${obQ}>${paramQ} THEN 1 ELSE 0 END`;
        }, o => o.params.length === 1);
        o.registerMethod(Decimal.prototype, "decimalPlaces", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE CHAR_LENGTH(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
        });
        o.registerMethod(Decimal.prototype, "dp", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE CHAR_LENGTH(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
        });
        o.registerMethod(Decimal.prototype, "isInt", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            return `${obQ}=TRUNC(${obQ})`;
        });
        o.registerMethod(Decimal.prototype, "isInteger", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            return `${obQ}=TRUNC(${obQ})`;
        });
        o.registerMethod(Decimal.prototype, "isNeg", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<0`);
        o.registerMethod(Decimal.prototype, "isNegative", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<0`);
        o.registerMethod(Decimal.prototype, "isPos", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>0`);
        o.registerMethod(Decimal.prototype, "isPositive", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>0`);
        o.registerMethod(Decimal.prototype, "isZero", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}=0`);
        o.registerMethod(Decimal.prototype, "isFinite", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)} ~ '^-?[0-9]+(\.[0-9]+)?$'`);
        o.registerMethod(Decimal.prototype, "isNaN", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)} !~ '^-?[0-9]+(\.[0-9]+)?$'`);

        o.registerMethod(Decimal, "random", (qb, exp, context) => {
            if (!exp.params.length) {
                return `RANDOM()`;
            }
            const paramQ = qb.toString(exp.params[0], context);
            return `FLOOR(RANDOM()* 10^${paramQ})/10^${paramQ}`;
        });
    });
    registerTranslationFunction("sqlite", o => {
        o.registerValueType(Decimal, { columnType: { columnType: "real", group: "String" } });
    });
    registerTranslationFunction("mssql", o => {
        o.registerMethod(Decimal.prototype, "decimalPlaces", (qb, exp, param) => {
            const obQ = qb.toString(exp.objectOperand, param);
            return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE LEN(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
        });
        o.registerMethod(Decimal.prototype, "dp", (qb, exp, param) => {
            const obQ = qb.toString(exp.objectOperand, param);
            return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE LEN(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
        });
    });
}