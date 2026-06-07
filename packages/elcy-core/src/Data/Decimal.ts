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

if (module) {
    import("src/ExpressionBuilder/SyntacticAnalyzer").then(o => {
        o.SyntacticAnalyzer.globalObjectMap.set("Decimal", Decimal);
    });

    import("src/Provider/Relational/RelationalQueryTranslator").then(o => {
        const translator = o.relationalQueryTranslator;
        translator.registerValueType(Decimal, { columnType: { columnType: "decimal", option: { precision: 18, scale: 6 }, group: "Decimal" }, hydrate: (value: string | number) => new Decimal(String(value)), persist: (value) => value.toFixed(), queryValue: (value) => value.toFixed(), instance: new Decimal(0) });

        /**
         * Decimal
         * TODO: toSD, toSignificantDigits, static methods
         */
        translator.registerConstructor(Decimal, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} as NUMERIC)`, o => o.params.length === 1);
        translator.registerFn(Decimal, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} as NUMERIC)`, o => o.params.length === 1);
        translator.registerMethod(Decimal.prototype, "plus", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}+${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "add", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}+${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "minus", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}-${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "sub", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}-${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "times", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}*${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "mul", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}*${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "div", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "dividedBy", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "pow", (qb, exp, context) => `POWER(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
        translator.registerMethod(Decimal.prototype, "toPower", (qb, exp, context) => `POWER(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
        translator.registerMethod(Decimal.prototype, "neg", (qb, exp, context) => `-${qb.toString(exp.objectOperand, context)}`);
        translator.registerMethod(Decimal.prototype, "negated", (qb, exp, context) => `-${qb.toString(exp.objectOperand, context)}`);
        translator.registerMethod(Decimal.prototype, "abs", (qb, exp, context) => `ABS(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "absoluteValue", (qb, exp, context) => `ABS(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "mod", (qb, exp, context) => `MOD(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
        translator.registerMethod(Decimal.prototype, "modulo", (qb, exp, context) => `MOD(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
        translator.registerMethod(Decimal.prototype, "sqrt", (qb, exp, context) => `SQRT(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "squareRoot", (qb, exp, context) => `SQRT(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "cbrt", (qb, exp, context) => `CBRT(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "cubeRoot", (qb, exp, context) => `CBRT(${qb.toString(exp.objectOperand, context)})`);

        translator.registerMethod(Decimal.prototype, "eq", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}=${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "equals", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}=${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "lt", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "lessThan", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "lte", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<=${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "lessThanOrEqualTo", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<=${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "gt", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "greaterThan", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "gte", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>=${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "greaterThanOrEqualTo", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>=${qb.toString(exp.params[0], context)}`);

        translator.registerMethod(Decimal.prototype, "round", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "floor", (qb, exp, context) => `FLOOR(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "ceil", (qb, exp, context) => `CEILING(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "trunc", (qb, exp, context) => `TRUNC(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "truncated", (qb, exp, context) => `TRUNC(${qb.toString(exp.objectOperand, context)})`);

        translator.registerMethod(Decimal.prototype, "sin", (qb, exp, context) => `SIN(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "sine", (qb, exp, context) => `SIN(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "cos", (qb, exp, context) => `COS(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "cosine", (qb, exp, context) => `COS(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "tan", (qb, exp, context) => `TAN(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "tangent", (qb, exp, context) => `TAN(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "asin", (qb, exp, context) => `ASIN(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "inverseSine", (qb, exp, context) => `ASIN(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "acos", (qb, exp, context) => `ACOS(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "inverseCosine", (qb, exp, context) => `ACOS(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "atan", (qb, exp, context) => `ATAN(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "inverseTangent", (qb, exp, context) => `ATAN(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "sinh", (qb, exp, context) => `SINH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "hyperbolicSine", (qb, exp, context) => `SINH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "cosh", (qb, exp, context) => `COSH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "hyperbolicCosine", (qb, exp, context) => `COSH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "tanh", (qb, exp, context) => `TANH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "hyperbolicTangent", (qb, exp, context) => `TANH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "asinh", (qb, exp, context) => `ASINH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "inverseHyperbolicSine", (qb, exp, context) => `ASINH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "acosh", (qb, exp, context) => `ACOSH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "inverseHyperbolicCosine", (qb, exp, context) => `ACOSH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "atanh", (qb, exp, context) => `ATANH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "inverseHyperbolicTangent", (qb, exp, context) => `ATANH(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "exp", (qb, exp, context) => `EXP(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "naturalExponential", (qb, exp, context) => `EXP(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "ln", (qb, exp, context) => `LN(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "naturalLogarithm", (qb, exp, context) => `LN(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "log", (qb, exp, context) => `LOG(${qb.toString(exp.objectOperand, context)})`);
        translator.registerMethod(Decimal.prototype, "logarithm", (qb, exp, context) => `LOG(${qb.toString(exp.objectOperand, context)})`);

        translator.registerMethod(Decimal.prototype, "clamp", (qb, exp, context) => `LEAST(GREATEST(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)}), ${qb.toString(exp.params[1], context)})`);
        translator.registerMethod(Decimal.prototype, "clampedTo", (qb, exp, context) => `LEAST(GREATEST(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)}), ${qb.toString(exp.params[1], context)})`);
        translator.registerMethod(Decimal.prototype, "divToInt", (qb, exp, context) => `FLOOR(${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)})`);
        translator.registerMethod(Decimal.prototype, "dividedToIntegerBy", (qb, exp, context) => `FLOOR(${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)})`);
        translator.registerMethod(Decimal.prototype, "toDP", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)})`, o => o.params.length === 1);
        translator.registerMethod(Decimal.prototype, "toDecimalPlaces", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)})`, o => o.params.length === 1);

        translator.registerMethod(Decimal.prototype, "toNumber", (qb, exp, context) => `CAST(${qb.toString(exp.objectOperand, context)} as DOUBLE PRECISION)`);
        translator.registerMethod(Decimal.prototype, "toNearest", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)})*${qb.toString(exp.params[0], context)}`);
        translator.registerMethod(Decimal.prototype, "toPrecision", (qb, exp, context) => {
            const ob = qb.toString(exp.objectOperand, context);
            const paramQ = exp.params.length ? qb.toString(exp.params[0], context) : "0";
            return `CASE WHEN ${ob}=0 THEN 0
ELSE ROUND(${ob}, ${paramQ} - FLOOR(LOG(10, ABS(${ob}))) - 1)
END`;
        });
        translator.registerMethod(Decimal.prototype, "cmp", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            const paramQ = qb.toString(exp.params[0], context);
            return `CASE WHEN ${obQ}<${paramQ} THEN -1 WHEN ${obQ}>${paramQ} THEN 1 ELSE 0 END`;
        }, o => o.params.length === 1);
        translator.registerMethod(Decimal.prototype, "comparedTo", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            const paramQ = qb.toString(exp.params[0], context);
            return `CASE WHEN ${obQ}<${paramQ} THEN -1 WHEN ${obQ}>${paramQ} THEN 1 ELSE 0 END`;
        }, o => o.params.length === 1);
        translator.registerMethod(Decimal.prototype, "decimalPlaces", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE CHAR_LENGTH(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
        });
        translator.registerMethod(Decimal.prototype, "dp", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE CHAR_LENGTH(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
        });
        translator.registerMethod(Decimal.prototype, "isInt", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            return `${obQ}=TRUNC(${obQ})`;
        });
        translator.registerMethod(Decimal.prototype, "isInteger", (qb, exp, context) => {
            const obQ = qb.toString(exp.objectOperand, context);
            return `${obQ}=TRUNC(${obQ})`;
        });
        translator.registerMethod(Decimal.prototype, "isNeg", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<0`);
        translator.registerMethod(Decimal.prototype, "isNegative", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<0`);
        translator.registerMethod(Decimal.prototype, "isPos", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>0`);
        translator.registerMethod(Decimal.prototype, "isPositive", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>0`);
        translator.registerMethod(Decimal.prototype, "isZero", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}=0`);
        translator.registerMethod(Decimal.prototype, "isFinite", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)} ~ '^-?[0-9]+(\.[0-9]+)?$'`);
        translator.registerMethod(Decimal.prototype, "isNaN", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)} !~ '^-?[0-9]+(\.[0-9]+)?$'`);

        translator.registerMethod(Decimal, "random", (qb, exp, context) => {
            if (!exp.params.length) {
                return `RANDOM()`;
            }
            const paramQ = qb.toString(exp.params[0], context);
            return `FLOOR(RANDOM()* 10^${paramQ})/10^${paramQ}`;
        });
    });

    import("src/Provider/Sqlite/SqliteQueryTranslator").then(o => o.sqliteQueryTranslator).then(o => {
        o.registerValueType(Decimal, { columnType: { columnType: "real", group: "String" } });
    });
    import("src/Provider/Mssql/MssqlQueryTranslator").then(o => o.mssqlQueryTranslator).then(o => {
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