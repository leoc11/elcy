import { Enumerable } from "@elcy/enumerable";
import { AdditionAssignmentExpression } from "../../ExpressionBuilder/Expression/AdditionAssignmentExpression";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { AssignmentExpression } from "../../ExpressionBuilder/Expression/AssignmentExpression";
import { BitwiseAndAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseAndAssignmentExpression";
import { BitwiseAndExpression } from "../../ExpressionBuilder/Expression/BitwiseAndExpression";
import { BitwiseNotExpression } from "../../ExpressionBuilder/Expression/BitwiseNotExpression";
import { BitwiseOrAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseOrAssignmentExpression";
import { BitwiseOrExpression } from "../../ExpressionBuilder/Expression/BitwiseOrExpression";
import { BitwiseSignedRightShiftAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseSignedRightShiftAssignmentExpression";
import { BitwiseXorAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseXorAssignmentExpression";
import { BitwiseXorExpression } from "../../ExpressionBuilder/Expression/BitwiseXorExpression";
import { BitwiseZeroLeftShiftAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseZeroLeftShiftAssignmentExpression";
import { BitwiseZeroRightShiftAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseZeroRightShiftAssignmentExpression";
import { DivisionAssignmentExpression } from "../../ExpressionBuilder/Expression/DivisionAssignmentExpression";
import { DivisionExpression } from "../../ExpressionBuilder/Expression/DivisionExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { ExponentiationAssignmentExpression } from "../../ExpressionBuilder/Expression/ExponentiationAssignmentExpression";
import { GreaterEqualExpression } from "../../ExpressionBuilder/Expression/GreaterEqualExpression";
import { GreaterThanExpression } from "../../ExpressionBuilder/Expression/GreaterThanExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IUnaryOperatorExpression } from "../../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { LeftDecrementExpression } from "../../ExpressionBuilder/Expression/LeftDecrementExpression";
import { LeftIncrementExpression } from "../../ExpressionBuilder/Expression/LeftIncrementExpression";
import { LessEqualExpression } from "../../ExpressionBuilder/Expression/LessEqualExpression";
import { LessThanExpression } from "../../ExpressionBuilder/Expression/LessThanExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ModulusAssignmentExpression } from "../../ExpressionBuilder/Expression/ModulusAssignmentExpression";
import { ModulusExpression } from "../../ExpressionBuilder/Expression/ModulusExpression";
import { MultiplicationAssignmentExpression } from "../../ExpressionBuilder/Expression/MultiplicationAssignmentExpression";
import { MultiplicationExpression } from "../../ExpressionBuilder/Expression/MultiplicationExpression";
import { NotEqualExpression } from "../../ExpressionBuilder/Expression/NotEqualExpression";
import { NotExpression } from "../../ExpressionBuilder/Expression/NotExpression";
import { OrExpression } from "../../ExpressionBuilder/Expression/OrExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { RightDecrementExpression } from "../../ExpressionBuilder/Expression/RightDecrementExpression";
import { RightIncrementExpression } from "../../ExpressionBuilder/Expression/RightIncrementExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "../../ExpressionBuilder/Expression/StrictNotEqualExpression";
import { SubstractionAssignmentExpression } from "../../ExpressionBuilder/Expression/SubstractionAssignmentExpression";
import { SubstractionExpression } from "../../ExpressionBuilder/Expression/SubstractionExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { DbFunction } from "../../Query/DbFunction";
import { IQueryBuilder } from "../../Query/IQueryBuilder";
import { IQueryBuilderContext } from "../../Query/IQueryBuilderContext";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { ObjectValueExpression } from "src/ExpressionBuilder/Expression/ObjectValueExpression";
import { fillZero, isEntityExp, isNonNullExp, isNull, isValue, toDateTimeString, toHexaString } from "src/Helper/Util";
import { NullCoalesceExpression } from "src/ExpressionBuilder/Expression/NullCoalesceExpression";
import { Null } from "src/Common/Constant";
import { BigIntColumnMetaData, BinaryColumnMetaData, BooleanColumnMetaData, DateColumnMetaData, DateTimeColumnMetaData, DecimalColumnMetaData, EnumColumnMetaData, IdentifierColumnMetaData, IntegerColumnMetaData, RealColumnMetaData, RowVersionColumnMetaData, SerializeColumnMetaData, StringColumnMetaData, TimeColumnMetaData } from "src/MetaData";
import { XMLParser } from "src/Extensions/FastXmlParser";
import { XMLBuilder } from "src/Extensions/FastXmlBuilder";
import { registerTranslator } from "src/Registry/QueryTranslatorRegistry";

export const relationalQueryTranslator = new QueryTranslator(Symbol("relational"));

//#region Value Type
relationalQueryTranslator.registerValueType<null>(Null, { columnType: { columnType: "nvarchar", option: { length: 255 }, group: "String" }, hydrate: _ => null, persist: _ => null, queryValue: _ => "NULL", instance: null });
relationalQueryTranslator.registerValueType(String, { columnType: { columnType: "nvarchar", option: { length: 255 }, group: "String" }, hydrate: (value) => String(value), persist: value => value, instance: "" });
relationalQueryTranslator.registerValueType(Number, { columnType: { columnType: "real", group: "Real" }, hydrate: (value) => Number(value), persist: value => value, queryValue: value => String(value), instance: 0 });
relationalQueryTranslator.registerValueType(BigInt, { columnType: { columnType: "bigint", group: "BigInt" }, hydrate: (value: bigint | string | number) => BigInt(value), persist: value => value, queryValue: value => String(value), instance: 0n });
relationalQueryTranslator.registerValueType(Boolean, { columnType: { columnType: "boolean", group: "Boolean" }, hydrate: (value: boolean | number) => Boolean(value), persist: value => value, queryValue: value => value ? "true" : "false", instance: false });
relationalQueryTranslator.registerValueType<Date>(Date, { columnType: { columnType: "datetime", group: "DateTime" }, hydrate: (value: string | Date) => typeof value === "string" ? new Date(value) : value, persist: value => value, queryValue: value => `'${toDateTimeString(value)}'`, instance: new Date(0) });

const toUint8Array = (value: DataView | ArrayBufferView) => new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
relationalQueryTranslator.registerValueType<Uint8Array>(Uint8Array, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => value, persist: value => value, queryValue: toHexaString, instance: new Uint8Array(0) });
relationalQueryTranslator.registerValueType<ArrayBuffer>(ArrayBuffer, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => value.buffer as ArrayBuffer, persist: (value) => new Uint8Array(value), queryValue: toHexaString, instance: new ArrayBuffer(0) });
relationalQueryTranslator.registerValueType<Uint16Array>(Uint16Array, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => new Uint16Array(value.buffer, value.byteOffset, value.byteLength), persist: toUint8Array, queryValue: toHexaString, instance: new Uint16Array(0) });
relationalQueryTranslator.registerValueType<Uint32Array>(Uint32Array, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => new Uint32Array(value.buffer, value.byteOffset, value.byteLength), persist: toUint8Array, queryValue: toHexaString, instance: new Uint32Array(0) });
relationalQueryTranslator.registerValueType<Int8Array>(Int8Array, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => new Int8Array(value.buffer, value.byteOffset, value.byteLength), persist: toUint8Array, queryValue: toHexaString, instance: new Int8Array(0) });
relationalQueryTranslator.registerValueType<Int16Array>(Int16Array, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => new Int16Array(value.buffer, value.byteOffset, value.byteLength), persist: toUint8Array, queryValue: toHexaString, instance: new Int16Array(0) });
relationalQueryTranslator.registerValueType<Int32Array>(Int32Array, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => new Int32Array(value.buffer, value.byteOffset, value.byteLength), persist: toUint8Array, queryValue: toHexaString, instance: new Int32Array(0) });
relationalQueryTranslator.registerValueType<Uint8ClampedArray>(Uint8ClampedArray, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => new Uint8ClampedArray(value.buffer, value.byteOffset, value.byteLength), persist: toUint8Array, queryValue: toHexaString, instance: new Uint8ClampedArray(0) });
relationalQueryTranslator.registerValueType<Float32Array>(Float32Array, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => new Float32Array(value.buffer, value.byteOffset, value.byteLength), persist: toUint8Array, queryValue: toHexaString, instance: new Float32Array(0) });
relationalQueryTranslator.registerValueType<Float64Array>(Float64Array, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => new Float64Array(value.buffer, value.byteOffset, value.byteLength), persist: toUint8Array, queryValue: toHexaString, instance: new Float64Array(0) });
relationalQueryTranslator.registerValueType<DataView>(DataView, { columnType: { columnType: "varbinary", group: "Binary" }, hydrate: (value: Uint8Array) => new DataView(value.buffer, value.byteOffset, value.byteLength), persist: toUint8Array, queryValue: toHexaString, instance: new DataView(new ArrayBuffer(0)) });

//#endregion

//#region Column Type
relationalQueryTranslator.registerColumnType(StringColumnMetaData, { columnType: "nvarchar", option: { length: 255 }, group: "String" });
relationalQueryTranslator.registerColumnType(BooleanColumnMetaData, { columnType: "boolean", group: "Boolean" });
relationalQueryTranslator.registerColumnType(IntegerColumnMetaData, { columnType: "int", group: "Integer" }, (value: number) => Math.trunc(value), (value: number) => Math.trunc(Math.round(value * 100) / 100));
relationalQueryTranslator.registerColumnType(BigIntColumnMetaData, { columnType: "bigint", group: "BigInt" });
relationalQueryTranslator.registerColumnType(RealColumnMetaData, { columnType: "real", group: "Real" });
relationalQueryTranslator.registerColumnType(DecimalColumnMetaData, { columnType: "decimal", option: { precision: 18, scale: 6 }, group: "Decimal" });
relationalQueryTranslator.registerColumnType(BinaryColumnMetaData, { columnType: "blob", group: "Binary" });
relationalQueryTranslator.registerColumnType(DateColumnMetaData, { columnType: "date", group: "Date" });
relationalQueryTranslator.registerColumnType(TimeColumnMetaData, { columnType: "time", group: "Time" },
    (value: string | Date, meta, t) => {
        const isNative = meta.type === Date || meta.type === String || !meta.type;
        if (!isNative) {
            return t.resolveValueType(meta.type).hydrate(value, meta);
        }

        let timePart: Record<"hour" | "minute" | "second" | "millisecond", number>;
        if (value instanceof Date) {
            timePart = {
                hour: meta.timeZoneHandling === "utc"? value.getUTCHours() : value.getHours(),
                minute: meta.timeZoneHandling === "utc"? value.getUTCMinutes() : value.getMinutes(),
                second: meta.timeZoneHandling === "utc"? value.getUTCSeconds() : value.getSeconds(),
                millisecond: meta.timeZoneHandling === "utc"? value.getUTCMilliseconds() : value.getMilliseconds()
            };
        }
        else {
            const parts = value.split(/[:.]/);
            timePart = {
                hour: +parts[0],
                minute: +parts[1],
                second: +(parts[2] ?? null),
                millisecond: +(parts[3] ?? null)
            };
        }

        switch (meta.type) {
            case Date: {
                if (meta.timeZoneHandling === "utc") {
                    return new Date(Date.UTC(1970, 0, 1, timePart.hour, timePart.minute, timePart.second, timePart.millisecond));
                }

                return new Date(1970, 0, 1, timePart.hour, timePart.minute, timePart.second, timePart.millisecond);
            }
            default: {
                return `${fillZero(timePart.hour)}:${fillZero(timePart.minute)}:${fillZero(timePart.second)}${timePart.millisecond ? `.${timePart.millisecond}` : ""}`;
            }
        }
    },
    (value, meta, t) => {
        const isNative = meta.type === Date || meta.type === String || !meta.type;
        if (!isNative) {
            return t.resolveValueType(meta.type).persist(value, meta);
        }

        switch (true) {
            case meta.type === Date && value instanceof Date: {
                if (meta.timeZoneHandling === "utc") {
                    return `${value.getUTCHours()}:${value.getUTCMinutes()}:${value.getUTCSeconds()}.${value.getUTCMilliseconds()}`;
                }

                return `${value.getHours()}:${value.getMinutes()}:${value.getSeconds()}.${value.getMilliseconds()}`;
            }
            case meta.type === String && typeof value === "string": {
                return value;
            }
            default: {
                return String(value);
            }
        }
    });
relationalQueryTranslator.registerColumnType(DateTimeColumnMetaData, { columnType: "timestamp", group: "DateTime" },
    (value: Date | string, meta, t) => {
        const isNative = meta.type === Date || meta.type == null;
        if (!isNative) {
            return t.resolveValueType(meta.type).hydrate(value, meta);
        }

        if (value instanceof Date && meta.timeZoneHandling === "utc") {
            value = `${value.getFullYear()}-${fillZero(value.getMonth() + 1)}-${fillZero(value.getDate())}T${fillZero(value.getHours())}:${fillZero(value.getMinutes())}:${fillZero(value.getSeconds())}.${fillZero(value.getMilliseconds(), 3)}Z`;
        }
        return value instanceof Date ? value : new Date(value);
    },
    (value: Date, meta: DateTimeColumnMetaData, t) => {
        const isNative = meta.type === Date || meta.type == null;
        if (!isNative) {
            return t.resolveValueType(meta.type).persist(value, meta);
        }

        return meta.timeZoneHandling === "utc" ? value.toISOString() : value;
    });
relationalQueryTranslator.registerColumnType(EnumColumnMetaData, { columnType: "nvarchar", option: { length: 50 }, group: "Enum" },
    (value: string, meta) => {
        switch (meta.type) {
            case Number: {
                return Number(meta.options[value]);
            }
            default: {
                return value;
            }
        }
    },
    (value, meta) => {
        if (typeof value === "number") {
            return meta.options[value];
        }

        return value;
    });
relationalQueryTranslator.registerColumnType(IdentifierColumnMetaData, { columnType: "varbinary", option: { length: 16 }, group: "Identifier" });
relationalQueryTranslator.registerColumnType(RowVersionColumnMetaData, { columnType: "int", group: "RowVersion" },
    (value: number | Uint8Array, meta, t) => {
        if (meta.type === Uint8Array && typeof value === "number") {
            throw "unexpected";
        }

        return t.resolveValueType(meta.type).hydrate(value, meta);
    });

let xmlParser: XMLParser;
let xmlBuilder: XMLBuilder;
relationalQueryTranslator.registerColumnType(SerializeColumnMetaData, { columnType: "json", group: "Serialize" },
    (value: string, meta) => {
        let valueObj: Record<string, unknown>;
        switch (meta.columnType) {
            case "json":
            case "jsonb": {
                valueObj = JSON.parse(value);
                break;
            }
            case "xml": {
                if (!xmlParser) {
                    if (!XMLParser) {
                        throw "require fast-xml-parser";
                    }
                    xmlParser = new XMLParser();
                }

                valueObj = xmlParser.parse(value);
            }
        }
        const obj = new meta.type() as Record<string, unknown>;
        const keys = Enumerable.from(Object.entries(obj))
            .filter(o => typeof o[1] !== "function" && (isNull(o[1]) || isValue(o[1])))
            .map(o => o[0])
            .union(Object.keys(valueObj));

        for (const key of keys) {
            obj[key] = valueObj[key];
        }

        return obj;
    },
    (value, meta) => {
        switch (meta.columnType) {
            case "json":
            case "jsonb": {
                return JSON.stringify(value);
            }
            case "xml": {
                if (!xmlBuilder) {
                    if (!XMLBuilder) {
                        throw "require fast-xml-parser";
                    }
                    xmlBuilder = new XMLBuilder();
                }

                return xmlBuilder.build(value);
            }
        }
    });

//#endregion

relationalQueryTranslator.registerConstructor(Date, () => `CURRENT_TIMESTAMP`, exp => exp.params.length === 0);

//#region Function

relationalQueryTranslator.registerFn(parseInt, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} AS INT)`);
relationalQueryTranslator.registerFn(parseFloat, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} AS FLOAT)`);
relationalQueryTranslator.registerFn(isNaN, (qb, exp, context) => `ISNUMERIC(${qb.toString(exp.params[0], context)}) = 0`);
relationalQueryTranslator.registerFn(Number, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} AS DOUBLE PRECISION)`);
relationalQueryTranslator.registerFn(String, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} AS nvarchar(max))`);
relationalQueryTranslator.registerFn(Boolean, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} AS boolean)`);
relationalQueryTranslator.registerFn(BigInt, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} as BIGINT)`);

//#endregion

//#region Member Access

/**
 * Math
 * TODO: LOG10E, LOG2E
 */
relationalQueryTranslator.registerMember(Math, "E", () => "EXP(1)", () => true);
relationalQueryTranslator.registerMember(Math, "LN10", () => "LN(10)", () => true);
relationalQueryTranslator.registerMember(Math, "LN2", () => "LN(2)", () => true);
relationalQueryTranslator.registerMember(Math, "PI", () => "PI()", () => true);
relationalQueryTranslator.registerMember(Math, "SQRT1_2", () => "SQRT(0.5)", () => true);
relationalQueryTranslator.registerMember(Math, "SQRT2", () => "SQRT(2)", () => true);

/**
 * String
 * TODO length
 */
relationalQueryTranslator.registerMember(String.prototype, "length", (qb, exp, context) => `CHAR_LENGTH(${qb.toString(exp.objectOperand, context)})`);

/**
 * Array
 * TODO: isArray
 */

/**
 * Date
 * TODO: UTC,now,parse
 */

//#endregion

//#region Method Call

/**
 * TODO: CHANGE TO QUERYABLE/ENUMERABLE
 * SelectExpression
 */
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "every" as any, (qb, exp, context) => `NOT EXIST(${qb.newLine(1) + qb.toString(exp.objectOperand, context) + qb.newLine(-1)})`);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "some" as any, (qb, exp, context) => `EXIST(${qb.newLine(1) + qb.toString(exp.objectOperand, context) + qb.newLine(-1)})`);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "count" as any, (qb, exp, context) => `COUNT(${exp.params.length && isEntityExp(exp.params[0]) ? `${qb.toString(exp.params[0], context)}.*` : "*"})`);
const aggregateTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, context: IQueryBuilderContext) => `${exp.methodName.toUpperCase()}(${qb.toString(exp.params[0], context)})`;
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "sum" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "min" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "max" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "avg" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "join" as any, (qb, exp, context) => `STRING_AGG(${qb.toString(exp.params[0], context)}, ${qb.toString(exp.params[1], context)})`);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "includes" as any, (qb, exp, context) => `${qb.toString(exp.params[0], context)} IN (${qb.newLine(1, true)}${qb.toString(exp.objectOperand, context)}${qb.newLine(-1, true)})`);

/**
 * Array
 * TODO: contains,concat,copyWithin,every,fill,filter,find,findIndex,forEach,indexOf,join,lastIndexOf,map,pop,push,reduce,reduceRight,reverse,shift,slice,some,sort,splice,toString,unshift,valueOf
 */
relationalQueryTranslator.registerMethod(Array.prototype, "includes", (qb, exp, context) => `${qb.toString(exp.params[0], context)} IN ${qb.toString(exp.objectOperand, context)}`);

/**
 * Enumerable
 * TODO: contains,concat,copyWithin,every,fill,filter,find,findIndex,forEach,indexOf,join,lastIndexOf,map,pop,push,reduce,reduceRight,reverse,shift,slice,some,sort,splice,toString,unshift,valueOf
 */
relationalQueryTranslator.registerMethod(Enumerable.prototype, "includes", (qb, exp, context) => `${qb.toString(exp.params[0], context)} IN (${qb.newLine(1, true)}${qb.toString(exp.objectOperand, context)}${qb.newLine(-1, true)})`);

/**
 * Math
 * TODO: max,min,acosh,asinh,atanh,cbrt,clz32,fround,imul
 */
const trigonoTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, context: IQueryBuilderContext) => `${exp.methodName.toUpperCase()}(${qb.toString(exp.params[0], context)})`;
relationalQueryTranslator.registerMethod(Math, "abs", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "acos", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "asin", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "atan", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "cos", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "exp", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "sin", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "sqrt", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "tan", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "floor", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "log", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "log10", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "sign", trigonoTranslator);
relationalQueryTranslator.registerMethod(Math, "ceil", (qb, exp, context) => `CEIL(${qb.toString(exp.params[0], context)})`);
relationalQueryTranslator.registerMethod(Math, "atan2", (qb, exp, context) => `ATN2(${qb.toString(exp.params[0], context)}, ${qb.toString(exp.params[1], context)})`);
relationalQueryTranslator.registerMethod(Math, "pow", (qb, exp, context) => `POWER(${qb.toString(exp.params[0], context)}, ${qb.toString(exp.params[1], context)})`);
relationalQueryTranslator.registerMethod(Math, "random", () => "RAND()", () => true);
relationalQueryTranslator.registerMethod(Math, "round", (qb, exp, context) => `ROUND(${qb.toString(exp.params[0], context)}, 0)`);
relationalQueryTranslator.registerMethod(Math, "expm1", (qb, exp, context) => `(EXP(${qb.toString(exp.params[0], context)}) - 1)`);
relationalQueryTranslator.registerMethod(Math, "hypot", (qb, exp, context) => `SQRT(${exp.params.map((p) => `POWER(${qb.toString(p, context)}, 2)`).join(" + ")})`);
relationalQueryTranslator.registerMethod(Math, "log1p", (qb, exp, context) => `LOG(1 + ${qb.toString(exp.params[0], context)})`);
relationalQueryTranslator.registerMethod(Math, "log2", (qb, exp, context) => `LOG(${qb.toString(exp.params[0], context)}, 2)`);
relationalQueryTranslator.registerMethod(Math, "sinh", (qb, exp, context) => `((EXP(${qb.toString(exp.params[0], context)}) - EXP(-${qb.toString(exp.params[0], context)})) / 2)`);
relationalQueryTranslator.registerMethod(Math, "cosh", (qb, exp, context) => `((EXP(${qb.toString(exp.params[0], context)}) + EXP(-${qb.toString(exp.params[0], context)})) / 2)`);
relationalQueryTranslator.registerMethod(Math, "tanh", (qb, exp, context) => `((EXP(2 * ${qb.toString(exp.params[0], context)}) - 1) / (EXP(2 * ${qb.toString(exp.params[0], context)}) + 1))`);
relationalQueryTranslator.registerMethod(Math, "trunc", (qb, exp, context) => `(${qb.toString(exp.params[0], context)} | 0)`);
relationalQueryTranslator.registerMethod(Math, "max", (qb, exp, context) => {
    if (exp.params.length <= 0) {
        throw new Error(`${exp.toString()} require at least one parameter`);
    }
    return `GREATEST(${exp.params.map((o) => qb.toString(o, context)).join(",")})`;
});
relationalQueryTranslator.registerMethod(Math, "min", (qb, exp, context) => {
    if (exp.params.length <= 0) {
        throw new Error(`${exp.toString()} require at least one parameter`);
    }
    return `LEAST(${exp.params.map((o) => qb.toString(o, context)).join(",")})`;
});
/**
 * String
 * TODO: localeCompare,match,normalize,padEnd,padStart,search,slice
 */
relationalQueryTranslator.registerMethod(String.prototype, "charAt", (qb, exp, context) => `SUBSTRING(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)} + 1, 1)`);
relationalQueryTranslator.registerMethod(String.prototype, "charCodeAt", (qb, exp, context) => `UNICODE(SUBSTRING(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)} + 1, 1))`);
relationalQueryTranslator.registerMethod(String.prototype, "concat", (qb, exp, context) => `CONCAT(${qb.toString(exp.objectOperand, context)}, ${exp.params.map((p) => qb.toString(p, context)).join(", ")})`);
relationalQueryTranslator.registerMethod(String.prototype, "endsWith", (qb, exp, context) => `(${qb.toString(exp.objectOperand, context)} LIKE CONCAT(${qb.valueString("%")}, ${qb.toString(exp.params[0], context)}))`);
relationalQueryTranslator.registerMethod(String.prototype, "includes", (qb, exp, context) =>
    exp.params.length > 1
        ? `(${qb.toString(exp.params[0], context)} + RIGHT(${qb.toString(exp.objectOperand, context)}, (CHAR_LENGTH(${qb.toString(exp.objectOperand, context)}) - ${qb.toString(exp.params[0], context)})))`
        : `(${qb.toString(exp.objectOperand, context)} LIKE CONCAT(${qb.valueString("%")}, ${qb.toString(exp.params[0], context)}, ${qb.valueString("%")}))`);
relationalQueryTranslator.registerMethod(String.prototype, "indexOf", (qb, exp, context) => `(CHARINDEX(${qb.toString(exp.params[0], context)}, ${qb.toString(exp.objectOperand, context) + (exp.params.length > 1 ? `, ${qb.toString(exp.params[1], context)}` : "")}) - 1)`);
relationalQueryTranslator.registerMethod(String.prototype, "lastIndexOf", (qb, exp, context) => `(CHAR_LENGTH(${qb.toString(exp.objectOperand, context)}) - CHARINDEX(${qb.toString(exp.params[0], context)}, REVERSE(${qb.toString(exp.objectOperand, context)})${(exp.params.length > 1 ? `, ${qb.toString(exp.params[1], context)}` : "")}))`);
relationalQueryTranslator.registerMethod(String.prototype, "repeat", (qb, exp, context) => `REPLICATE(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)})`);
relationalQueryTranslator.registerMethod(String.prototype, "replace", (qb, exp, context) => `REPLACE(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)}, ${qb.toString(exp.params[1], context)})`);
relationalQueryTranslator.registerMethod(String.prototype, "split", (qb, exp, context) => `STRING_SPLIT(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)})`);
relationalQueryTranslator.registerMethod(String.prototype, "startsWith", (qb, exp, context) => `(${qb.toString(exp.objectOperand, context)} LIKE CONCAT(${qb.toString(exp.params[0], context)}, ${qb.valueString("%")}))`);
relationalQueryTranslator.registerMethod(String.prototype, "substr", (qb, exp, context) => `SUBSTRING(${qb.toString(exp.objectOperand, context)}, (${qb.toString(exp.params[0], context)} + 1), ${(exp.params.length > 1 ? qb.toString(exp.params[1], context) : "8000")})`);
relationalQueryTranslator.registerMethod(String.prototype, "substring", (qb, exp, context) => `SUBSTRING(${qb.toString(exp.objectOperand, context)}, (${qb.toString(exp.params[0], context)} + 1), ${(exp.params.length > 1 ? `(${qb.toString(exp.params[1], context)} - ${qb.toString(exp.params[0], context)})` : "8000")})`);
const tolowerTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, context: IQueryBuilderContext) => `LOWER(${qb.toString(exp.objectOperand, context)})`;
relationalQueryTranslator.registerMethod(String.prototype, "toLowerCase", tolowerTranslator);
relationalQueryTranslator.registerMethod(String.prototype, "toLocaleLowerCase", tolowerTranslator);
const toupperTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, context: IQueryBuilderContext) => `UPPER(${qb.toString(exp.objectOperand, context)})`;
relationalQueryTranslator.registerMethod(String.prototype, "toUpperCase", toupperTranslator);
relationalQueryTranslator.registerMethod(String.prototype, "toLocaleUpperCase", toupperTranslator);
const stringValueOf = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, ontext: IQueryBuilderContext) => qb.toString(exp.objectOperand, ontext);
relationalQueryTranslator.registerMethod(String.prototype, "toString", stringValueOf);
relationalQueryTranslator.registerMethod(String.prototype, "valueOf", stringValueOf);
relationalQueryTranslator.registerMethod(String.prototype, "trim", (qb, exp, context) => `RTRIM(LTRIM(${qb.toString(exp.objectOperand, context)}))`);

/**
 * Number
 * TODO: isFinite,isInteger,isNaN,isSafeInteger, toLocaleString,toExponential,toFixed,toPrecision
 */
relationalQueryTranslator.registerMethod(Number.prototype, "toString", (qb, exp, context) => `CAST(${qb.toString(exp.objectOperand, context)} AS nvarchar(255))`);
relationalQueryTranslator.registerMethod(Number.prototype, "valueOf", (qb, exp, context) => qb.toString(exp.objectOperand, context));
relationalQueryTranslator.registerMethod(Number.prototype, "toFixed", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)})`, o => o.params.length === 1);
relationalQueryTranslator.registerMethod(Number.prototype, "toPrecision", (qb, exp, context) => {
    const ob = qb.toString(exp.objectOperand, context);
    const paramQ = exp.params.length ? qb.toString(exp.params[0], context) : "0";
    return `CASE WHEN ${ob}=0 THEN 0
ELSE ROUND(${ob}, ${paramQ} - FLOOR(LOG(10, ABS(${ob}))) - 1)
END`;
});

/**
 * BigInt
 * TODO: toLocaleString
 */
relationalQueryTranslator.registerMethod(BigInt.prototype, "toString", (qb, exp, context) => `CAST(${qb.toString(exp.objectOperand, context)} AS nvarchar(max))`);
relationalQueryTranslator.registerMethod(BigInt.prototype, "valueOf", (qb, exp, context) => qb.toString(exp.objectOperand, context));

/**
 * Symbol
 * TODO: toString
 */

/**
 * Boolean
 * TODO:
 */
relationalQueryTranslator.registerMethod(Boolean.prototype, "toString" as any, (qb, exp, context) => `(CASE WHEN (${qb.toString(exp.objectOperand, context)}) THEN ${qb.valueString("true")} ELSE ${qb.valueString("false")} END)`);

/**
 * Date
 * TODO: getTime,getTimezoneOffset,getUTCDate,getUTCDay,getUTCFullYear,getUTCHours,getUTCMilliseconds,getUTCMinutes,getUTCMonth,getUTCSeconds,getYear,setTime,setUTCDate,setUTCFullYear,setUTCHours,setUTCMilliseconds,setUTCMinutes,setUTCMonth,setUTCSeconds,toJSON,toISOString,toLocaleDateString,toLocaleTimeString,toLocaleString,toString,valueOf,toTimeString,toUTCString,toGMTString
 */
relationalQueryTranslator.registerMethod(Date.prototype, "getDate", (qb, exp, context) => `DAY(${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getDay", (qb, exp, context) => `(DATEPART(weekday, ${qb.toString(exp.objectOperand, context)}) - 1)`);
relationalQueryTranslator.registerMethod(Date.prototype, "getFullYear", (qb, exp, context) => `YEAR(${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getHours", (qb, exp, context) => `DATEPART(hour, ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getMinutes", (qb, exp, context) => `DATEPART(minute, ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getMonth", (qb, exp, context) => `(MONTH(${qb.toString(exp.objectOperand, context)}) - 1)`);
relationalQueryTranslator.registerMethod(Date.prototype, "getSeconds", (qb, exp, context) => `DATEPART(second, ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getMilliseconds", (qb, exp, context) => `DATEPART(millisecond, ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setDate", (qb, exp, context) => `DATEADD(DAY, (${qb.toString(exp.params[0], context)} - DAY(${qb.toString(exp.objectOperand, context)})), ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setFullYear", (qb, exp, context) => `DATEADD(YYYY, (${qb.toString(exp.params[0], context)} - YEAR(${qb.toString(exp.objectOperand, context)})), ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setHours", (qb, exp, context) => `DATEADD(HH, (${qb.toString(exp.params[0], context)} - DATEPART(hour, ${qb.toString(exp.objectOperand, context)})), ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setMilliseconds", (qb, exp, context) => `DATEADD(MS, (${qb.toString(exp.params[0], context)} - DATEPART(millisecond, ${qb.toString(exp.objectOperand, context)})), ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setMinutes", (qb, exp, context) => `DATEADD(MI, (${qb.toString(exp.params[0], context)} - DATEPART(minute, ${qb.toString(exp.objectOperand, context)})), ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setMonth", (qb, exp, context) => `DATEADD(MM, (${qb.toString(exp.params[0], context)} - (MONTH(${qb.toString(exp.objectOperand, context)}) - 1)), ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setSeconds", (qb, exp, context) => `DATEADD(SS, (${qb.toString(exp.params[0], context)} - DATEPART(second, ${qb.toString(exp.objectOperand, context)})), ${qb.toString(exp.objectOperand, context)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "toDateString", (qb, exp, context) => `CONCAT(LEFT(DATENAME(WEEKDAY, ${qb.toString(exp.objectOperand, context)}), 3), ${qb.valueString(" ")}, LEFT(DATENAME(MONTH, ${qb.toString(exp.objectOperand, context)}), 3), ${qb.valueString(" ")}, RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.toString(exp.objectOperand, context)}))), 2), ${qb.valueString(" ")}, RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.toString(exp.objectOperand, context)}))), 2))`);

/**
 * RegExp
 * TODO: exec,toString
 */
relationalQueryTranslator.registerMethod(RegExp.prototype, "test", (qb, exp, context) => `${qb.toString(exp.params[0], context)} REGEXP ${qb.toString(exp.objectOperand, context)}`);

/**
 * Function
 * TODO: apply,bind,call,toSource,toString
 */

//#endregion

//#region Operator

// http://dataeducation.com/bitmask-handling-part-4-left-shift-and-right-shift/
// TypeofExpression,BitwiseSignedRightShiftExpression, BitwiseZeroRightShiftExpression
// BitwiseZeroLeftShiftExpression,InstanceofExpression
const aritAssignmentTranlator = <T>(qb: IQueryBuilder, exp: IBinaryOperatorExpression<T>, operator: string, context: IQueryBuilderContext) => {
    if (!(exp.leftOperand instanceof ParameterExpression)) {
        throw new Error(`Operator ${exp.toString()} only support parameter for left operand`);
    }
    const varString = qb.toString(exp.leftOperand, context);
    return `${varString} = ${varString}${operator}${qb.toOperandString(exp.rightOperand, context)}`;
};
relationalQueryTranslator.registerOperator(AdditionAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, "+", context));
relationalQueryTranslator.registerOperator(SubstractionAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, "-", context));
relationalQueryTranslator.registerOperator(MultiplicationAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, "*", context));
relationalQueryTranslator.registerOperator(DivisionAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, "/", context));
relationalQueryTranslator.registerOperator(ExponentiationAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, "**", context));
relationalQueryTranslator.registerOperator(ModulusAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, "%", context));
relationalQueryTranslator.registerOperator(BitwiseAndAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, "&", context));
relationalQueryTranslator.registerOperator(BitwiseOrAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, "|", context));
relationalQueryTranslator.registerOperator(BitwiseXorAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, "^", context));
relationalQueryTranslator.registerOperator(BitwiseZeroLeftShiftAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, "<<", context));
relationalQueryTranslator.registerOperator(BitwiseZeroRightShiftAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, ">>", context));
relationalQueryTranslator.registerOperator(BitwiseSignedRightShiftAssignmentExpression, (qb, exp, context) => aritAssignmentTranlator(qb, exp, ">>>", context));

const incrementTranslator = (qb: IQueryBuilder, exp: IUnaryOperatorExpression, operator: string, context: IQueryBuilderContext) => {
    if (!(exp.operand instanceof ParameterExpression)) {
        throw new Error(`Operator ${exp.toString()} only support parameter operand`);
    }
    const varString = qb.toString(exp.operand, context);
    return `${varString} = ${varString}${operator}${qb.valueString(1)}`;
};
relationalQueryTranslator.registerOperator(LeftIncrementExpression, (qb, exp, context) => incrementTranslator(qb, exp, "+", context));
relationalQueryTranslator.registerOperator(LeftDecrementExpression, (qb, exp, context) => incrementTranslator(qb, exp, "-", context));
relationalQueryTranslator.registerOperator(RightIncrementExpression, (qb, exp, context) => `(${incrementTranslator(qb, exp, "+", context)}) - 1`);
relationalQueryTranslator.registerOperator(RightDecrementExpression, (qb, exp, context) => `(${incrementTranslator(qb, exp, "-", context)}) + 1`);

const binaryTranslator = <T>(qb: IQueryBuilder, exp: IBinaryOperatorExpression<T>, operator: string, context: IQueryBuilderContext) => `${qb.toOperandString(exp.leftOperand, context)}${operator}${qb.toOperandString(exp.rightOperand, context)}`;
relationalQueryTranslator.registerOperator(AssignmentExpression, (qb, exp, context) => binaryTranslator(qb, exp, "=", context));
relationalQueryTranslator.registerOperator(GreaterEqualExpression, (qb, exp, context) => binaryTranslator(qb, exp, ">=", context));
relationalQueryTranslator.registerOperator(GreaterThanExpression, (qb, exp, context) => binaryTranslator(qb, exp, ">", context));
relationalQueryTranslator.registerOperator(LessEqualExpression, (qb, exp, context) => binaryTranslator(qb, exp, "<=", context));
relationalQueryTranslator.registerOperator(LessThanExpression, (qb, exp, context) => binaryTranslator(qb, exp, "<", context));
relationalQueryTranslator.registerOperator(ModulusExpression, (qb, exp, context) => binaryTranslator(qb, exp, "%", context));
relationalQueryTranslator.registerOperator(SubstractionExpression, (qb, exp, context) => binaryTranslator(qb, exp, "-", context));
relationalQueryTranslator.registerOperator(MultiplicationExpression, (qb, exp, context) => binaryTranslator(qb, exp, "*", context));
relationalQueryTranslator.registerOperator(DivisionExpression, (qb, exp, context) => binaryTranslator(qb, exp, "/", context));
relationalQueryTranslator.registerOperator(AdditionExpression, (qb, exp, context) => {
    if (exp.type === String) {
        return `CONCAT(${qb.toOperandString(exp.leftOperand, context)}, ${qb.toOperandString(exp.rightOperand, context)})`;
    }

    return `${qb.toOperandString(exp.leftOperand, context)}+${qb.toOperandString(exp.rightOperand, context)}`;
});
relationalQueryTranslator.registerOperator(BitwiseAndExpression, (qb, exp, context) => binaryTranslator(qb, exp, "&", context));
relationalQueryTranslator.registerOperator(BitwiseOrExpression, (qb, exp, context) => binaryTranslator(qb, exp, "|", context));
relationalQueryTranslator.registerOperator(BitwiseXorExpression, (qb, exp, context) => binaryTranslator(qb, exp, "^", context));

const equalTranslator = (qb: IQueryBuilder, exp: IBinaryOperatorExpression, context: IQueryBuilderContext) => {
    const leftExpString = qb.toOperandString(exp.leftOperand, context);
    const rightExpString = qb.toOperandString(exp.rightOperand, context);
    if (rightExpString === "NULL") {
        return `${leftExpString} IS NULL`;
    }
    if (leftExpString === "NULL") {
        return `${rightExpString} IS NULL`;
    }
    if (isNonNullExp(exp.leftOperand) || isNonNullExp(exp.rightOperand)) {
        return `${leftExpString}=${rightExpString}`;
    }
    return `${leftExpString} IS NOT DISTINCT FROM ${rightExpString}`;
};
relationalQueryTranslator.registerOperator(EqualExpression, equalTranslator);
relationalQueryTranslator.registerOperator(StrictEqualExpression, equalTranslator);
const notEqualTranslator = (qb: IQueryBuilder, exp: NotEqualExpression | StrictNotEqualExpression, context: IQueryBuilderContext) => {
    const leftExpString = qb.toOperandString(exp.leftOperand, context);
    const rightExpString = qb.toOperandString(exp.rightOperand, context);
    if (rightExpString === "NULL") {
        return `${leftExpString} IS NOT NULL`;
    }
    if (leftExpString === "NULL") {
        return `${rightExpString} IS NOT NULL`;
    }
    if (isNonNullExp(exp.leftOperand) || isNonNullExp(exp.rightOperand)) {
        return `${leftExpString}<>${rightExpString}`;
    }
    return `${leftExpString} IS DISTINCT FROM ${rightExpString}`;
};
relationalQueryTranslator.registerOperator(NotEqualExpression, notEqualTranslator);
relationalQueryTranslator.registerOperator(StrictNotEqualExpression, notEqualTranslator);

relationalQueryTranslator.registerOperator(OrExpression, (qb, exp, context) => Enumerable.from(exp.operands).map(o => qb.toLogicalString(o, context)).join(" OR "));
relationalQueryTranslator.registerOperator(AndExpression, (qb, exp, context) => Enumerable.from(exp.operands).map(o => qb.toLogicalString(o, context)).join(" AND "));
relationalQueryTranslator.registerOperator(NotExpression, (qb, exp, context) => `NOT(${qb.newLine(1)}${qb.toLogicalString(exp.operand, context)}${qb.newLine(-1)})`);
relationalQueryTranslator.registerOperator(BitwiseNotExpression, (qb, exp, context) => `~(${qb.toOperandString(exp.operand, context)})`);
relationalQueryTranslator.registerOperator(TernaryExpression, (qb, exp, context) => `(${qb.newLine(1)}CASE WHEN (${qb.toString(exp.logicalOperand, context)}) ${qb.newLine()}THEN ${qb.toOperandString(exp.trueOperand, context)}${qb.newLine()}ELSE ${qb.toOperandString(exp.falseOperand, context)}${qb.newLine()}END${qb.newLine(-1)})`);
relationalQueryTranslator.registerOperator(NullCoalesceExpression, (qb, exp, context) => `COALESCE(${qb.toString(exp.leftOperand, context)}, ${qb.toString(exp.rightOperand, context)})`);

//#endregion

relationalQueryTranslator.registerMethod(DbFunction, "like", (qb, exp, context) => {
    let escape = "";
    if (exp.params.length > 2) {
        escape = ` ESCAPE ${qb.toString(exp.params[2], context)}`;
    }

    return `(${qb.toString(exp.params[0], context)} LIKE ${qb.toString(exp.params[1], context)}${escape})`;
});
relationalQueryTranslator.registerMethod(DbFunction, "timestamp", () => "CURRENT_TIMESTAMP", () => true);
relationalQueryTranslator.registerMethod(DbFunction, "utcTimestamp", () => "CURRENT_TIMESTAMP AT TIME ZONE 'UTC'", () => true);
relationalQueryTranslator.registerMethod(DbFunction, "dateAdd", (qb, exp, context) => {
    const dateExp = exp.params[0] as IExpression<Date>;
    const paramExp = exp.params[1] as ObjectValueExpression<Record<"years" | "months" | "days" | "hours" | "minutes" | "seconds" | "milliseconds", number>>;
    const intervalParams = [] as string[];
    if (paramExp.object.years) {
        intervalParams.push(`years => ${qb.toString(paramExp.object.years, context)}`);
    }
    if (paramExp.object.months) {
        intervalParams.push(`months => ${qb.toString(paramExp.object.months, context)}`);
    }
    if (paramExp.object.days) {
        intervalParams.push(`days => ${qb.toString(paramExp.object.days, context)}`);
    }
    if (paramExp.object.hours) {
        intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, context)}`);
    }
    if (paramExp.object.minutes) {
        intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, context)}`);
    }
    let secondParts = [] as string[];
    if (paramExp.object.seconds) {
        secondParts.push(qb.toString(paramExp.object.seconds, context));
    }
    if (paramExp.object.milliseconds) {
        secondParts.push(`(${qb.toString(paramExp.object.milliseconds, context)} / 1000)`);
    }
    if (secondParts.length) {
        intervalParams.push(`secs => ${secondParts.join("+")}`);
    }
    return `${qb.toString(dateExp, context)} + make_interval(${intervalParams.join(",")})`;
});
relationalQueryTranslator.registerMethod(DbFunction, "getDate", (qb, exp, context) => `CAST(${qb.toString(exp.objectOperand, context)} AS DATE)`);
relationalQueryTranslator.registerMethod(DbFunction, "getTime", (qb, exp, context) => `CAST(${qb.toString(exp.objectOperand, context)} AS TIME)`);

registerTranslator("default", relationalQueryTranslator);
