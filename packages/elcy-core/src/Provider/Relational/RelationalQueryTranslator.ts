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
import { Temporal } from "src/Data/Temporal";
import { Decimal } from "src/Data/Decimal";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { ObjectValueExpression } from "src/ExpressionBuilder/Expression/ObjectValueExpression";
import { ValueExpression } from "src/ExpressionBuilder/Expression/ValueExpression";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { isEntityExp, isNonNullExp, toDateTimeString, toHexaString } from "src/Helper/Util";
import { NullCoalesceExpression } from "src/ExpressionBuilder/Expression/NullCoalesceExpression";
import { Null } from "src/Common/Constant";
import { TimeSpan } from "src/Data/TimeSpan";
import { Uuid } from "src/Data/Uuid";

export const relationalQueryTranslator = new QueryTranslator(Symbol("relational"));

//#region Value Translator
relationalQueryTranslator.registerValue(Null, _ => "NULL");
relationalQueryTranslator.registerValue(String, val => `'${val.replace(/'/ig, "''")}'`);
relationalQueryTranslator.registerValue(Number, val => String(val));
relationalQueryTranslator.registerValue(BigInt, val => String(val));
relationalQueryTranslator.registerValue(Boolean, val => val ? "true" : "false");
relationalQueryTranslator.registerValue<Date>(Date, val => `'${toDateTimeString(val)}'`);
relationalQueryTranslator.registerValue(TimeSpan, val => `'${val}'`);
relationalQueryTranslator.registerValue(Uuid, val => `'${val}'`);
relationalQueryTranslator.registerValue(ArrayBuffer, toHexaString);
relationalQueryTranslator.registerValue(Uint8Array, toHexaString);
relationalQueryTranslator.registerValue(Uint16Array, toHexaString);
relationalQueryTranslator.registerValue(Uint32Array, toHexaString);
relationalQueryTranslator.registerValue(Int8Array, toHexaString);
relationalQueryTranslator.registerValue(Int16Array, toHexaString);
relationalQueryTranslator.registerValue(Int32Array, toHexaString);
relationalQueryTranslator.registerValue(Uint8ClampedArray, toHexaString);
relationalQueryTranslator.registerValue(Float32Array, toHexaString);
relationalQueryTranslator.registerValue(Float64Array, toHexaString);
relationalQueryTranslator.registerValue(DataView, toHexaString);

relationalQueryTranslator.registerColumnType(Null, { columnType: "nvarchar", option: { length: 255 }, group: "String" });
relationalQueryTranslator.registerColumnType(String, { columnType: "nvarchar", option: { length: 255 }, group: "String" });
relationalQueryTranslator.registerColumnType(Number, { columnType: "decimal", option: { precision: 18, scale: 6 }, group: "Decimal" });
relationalQueryTranslator.registerColumnType(BigInt, { columnType: "bigint", group: "BigInt" });
relationalQueryTranslator.registerColumnType(Boolean, { columnType: "boolean", group: "Boolean" });
relationalQueryTranslator.registerColumnType(Date, { columnType: "datetime", group: "DateTime" });
relationalQueryTranslator.registerColumnType(TimeSpan, { columnType: "time", group: "Time" });
relationalQueryTranslator.registerColumnType(Uuid, { columnType: "uuid", group: "Identifier" });
relationalQueryTranslator.registerColumnType(ArrayBuffer, { columnType: "varbinary", group: "Binary" });
relationalQueryTranslator.registerColumnType(Uint8Array, { columnType: "varbinary", group: "Binary" });
relationalQueryTranslator.registerColumnType(Uint16Array, { columnType: "varbinary", group: "Binary" });
relationalQueryTranslator.registerColumnType(Uint32Array, { columnType: "varbinary", group: "Binary" });
relationalQueryTranslator.registerColumnType(Int8Array, { columnType: "varbinary", group: "Binary" });
relationalQueryTranslator.registerColumnType(Int16Array, { columnType: "varbinary", group: "Binary" });
relationalQueryTranslator.registerColumnType(Int32Array, { columnType: "varbinary", group: "Binary" });
relationalQueryTranslator.registerColumnType(Uint8ClampedArray, { columnType: "varbinary", group: "Binary" });
relationalQueryTranslator.registerColumnType(Float32Array, { columnType: "varbinary", group: "Binary" });
relationalQueryTranslator.registerColumnType(Float64Array, { columnType: "varbinary", group: "Binary" });
relationalQueryTranslator.registerColumnType(DataView, { columnType: "varbinary", group: "Binary" });

//#endregion

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

if (Temporal) {
    /**
     * Temporal.Instant
     * TODO: since, until
     */
    relationalQueryTranslator.registerValue(Temporal.Instant, (val) => `'${val}'`);
    relationalQueryTranslator.registerValue(Temporal.PlainDate, (val) => `'${val}'`);
    relationalQueryTranslator.registerValue(Temporal.PlainTime, (val) => `'${val}'`);

    relationalQueryTranslator.registerColumnType(Temporal.Instant, { columnType: "datetime", group: "DateTime" });
    relationalQueryTranslator.registerColumnType(Temporal.PlainDate, { columnType: "date", group: "Date" });
    relationalQueryTranslator.registerColumnType(Temporal.PlainTime, { columnType: "time", group: "Date" });

    relationalQueryTranslator.registerMethod(Temporal.Instant, "compare", (qb, exp, context) => {
        const param1 = qb.toString(exp.params[0], context);
        const param2 = qb.toString(exp.params[2], context);
        return `CASE WHEN ${param1}<${param2} THEN -1 WHEN ${param1}>${param2} THEN 1 ELSE 0 END`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainDate, "compare", (qb, exp, context) => {
        const param1 = qb.toString(exp.params[0], context);
        const param2 = qb.toString(exp.params[2], context);
        return `CASE WHEN ${param1}<${param2} THEN -1 WHEN ${param1}>${param2} THEN 1 ELSE 0 END`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainTime, "compare", (qb, exp, context) => {
        const param1 = qb.toString(exp.params[0], context);
        const param2 = qb.toString(exp.params[2], context);
        return `CASE WHEN ${param1}<${param2} THEN -1 WHEN ${param1}>${param2} THEN 1 ELSE 0 END`;
    });

    relationalQueryTranslator.registerMethod(Temporal.Instant, "from", (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} as TIMESTAMP WITH TIME ZONE)`);
    relationalQueryTranslator.registerMethod(Temporal.Instant, "fromEpochMilliseconds", (qb, exp, context) => {
        const value = context.parameters.get(exp.params[0] as SqlParameterExpression)?.value as number;
        return `TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00 UTC' + INTERVAL ${qb.toString(new ValueExpression(`${value / 1_000} SECOND`), context)}`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Instant, "fromEpochNanoseconds", (qb, exp, context) => {
        const value = context.parameters.get(exp.params[0] as SqlParameterExpression)?.value as number;
        return `TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00 UTC' + INTERVAL ${qb.toString(new ValueExpression(`${value / 1_000_000} SECOND`), context)}`;
    });
    relationalQueryTranslator.registerMember(Temporal.Instant.prototype, "epochMilliseconds", (qb, exp, context) => `CAST((${qb.toString(exp.objectOperand, context)} - TIMESTAMP '1970-01-01 00:00:00 UTC') DAY TO SECOND AS DECIMAL(20,3)) * 1000`);
    relationalQueryTranslator.registerMember(Temporal.Instant.prototype, "epochNanoseconds", (qb, exp, context) => `CAST((${qb.toString(exp.objectOperand, context)} - TIMESTAMP '1970-01-01 00:00:00 UTC') DAY TO SECOND AS DECIMAL(20,3)) * 1000000000`);

    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "toString", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "toJSON", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "toZonedDateTimeISO", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)} AT TIME ZONE ${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "add", (qb, exp, context) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Omit<Temporal.DurationLike, 'years' | 'months' | 'weeks' | 'days'>>;
        const intervalParams = [] as string[];
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
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `(${qb.toString(exp.objectOperand, context)} + make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "subtract", (qb, exp, context) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Omit<Temporal.DurationLike, 'years' | 'months' | 'weeks' | 'days'>>;
        const intervalParams = [] as string[];
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
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, context)}) - make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "equals", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)})=${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "round", (qb, exp, context) => {
        let smallestUnitParam: IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>> = undefined;
        if (exp.params[0] instanceof ObjectValueExpression) {
            const paramExp = exp.params[0] as ObjectValueExpression<Exclude<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
            if (paramExp.object.roundingMode) {
                throw new Error(`Temporal.Instant.round: roundingMode not supported`);
            }
            if (paramExp.object.roundingIncrement) {
                throw new Error(`Temporal.Instant.round: roundingIncrement not supported`);
            }
            if (paramExp.object.smallestUnit) {
                smallestUnitParam = paramExp.object.smallestUnit as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
            }
        }
        else {
            smallestUnitParam = exp.params[0] as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
        }
        return `DATE_TRUNC(${qb.toString(smallestUnitParam, context)}, ${qb.toString(exp.objectOperand, context)})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "valueOf", (qb, exp, context) => {
        throw new Error(`Temporal.Instant.valueOf: not supported`);
    });


    /**
     * Temporal.PlainDate
     * TODO: since, until, calendarId, dayOfWeek, dayOfYear, daysInMonth, daysInWeek, daysInYear, era, eraYear, inleapYear
     * monthinyear, weekofyear, yearofweek, withCalendar()
     */
    relationalQueryTranslator.registerMethod(Temporal.PlainDate, "from", (qb, exp, context) => `DATE ${qb.toString(exp.params[0], context)}`);

    relationalQueryTranslator.registerMember(Temporal.PlainDate.prototype, "year", (qb, exp, context) => `EXTRACT(YEAR FROM ${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainDate.prototype, "month", (qb, exp, context) => `EXTRACT(MONTH FROM ${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainDate.prototype, "day", (qb, exp, context) => `EXTRACT(DAY FROM ${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainDate.prototype, "monthCode", (qb, exp, context) => `${qb.valueString("M")}`);

    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "toString", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "toJSON", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "add", (qb, exp, context) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
        const intervalParams = [] as string[];
        if (paramExp.object.years) {
            intervalParams.push(`years => ${qb.toString(paramExp.object.years, context)}`);
        }
        if (paramExp.object.months) {
            intervalParams.push(`months => ${qb.toString(paramExp.object.months, context)}`);
        }
        if (paramExp.object.weeks) {
            intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, context)}`);
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
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, context)} + make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "subtract", (qb, exp, context) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
        const intervalParams = [] as string[];
        if (paramExp.object.years) {
            intervalParams.push(`years => ${qb.toString(paramExp.object.years, context)}`);
        }
        if (paramExp.object.months) {
            intervalParams.push(`months => ${qb.toString(paramExp.object.months, context)}`);
        }
        if (paramExp.object.weeks) {
            intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, context)}`);
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
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, context)}) - make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "equals", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)})=${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "with", (qb, exp, context) => {
        if (exp.params.length !== 1) {
            throw Error("Temporal.PlainDate.with: only support info");
        }
        const paramInfoExp = exp.params[0] as ObjectValueExpression<Temporal.PlainDateLike>;
        if (paramInfoExp.object.calendar) {
            throw Error("Temporal.PlainDate.with: calendar not supported");
        }
        if (paramInfoExp.object.era) {
            throw Error("Temporal.PlainDate.with: era not supported");
        }
        if (paramInfoExp.object.eraYear) {
            throw Error("Temporal.PlainDate.with: eraYear not supported");
        }
        if (paramInfoExp.object.monthCode) {
            throw Error("Temporal.PlainDate.with: monthCode not supported");
        }
        const objectQ = qb.toString(exp.objectOperand, context);
        let yearQ = `EXTRACT(YEAR FROM ${objectQ})`;
        if (paramInfoExp.object.year) {
            yearQ = `COALESCE(${qb.toString(paramInfoExp.object.year, context)}, ${yearQ})`;
        }
        let monthQ = `EXTRACT(MONTH FROM ${objectQ})`;
        if (paramInfoExp.object.month) {
            monthQ = `COALESCE(${qb.toString(paramInfoExp.object.month, context)}, ${monthQ})`;
        }
        let dayQ = `EXTRACT(DAY FROM ${objectQ})`;
        if (paramInfoExp.object.day) {
            dayQ = `COALESCE(${qb.toString(paramInfoExp.object.day, context)}, ${dayQ})`;
        }

        return `MAKE_DATE(CAST(${yearQ} as int), CAST(${monthQ} as int), CAST(${dayQ} as int))`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "valueOf", (qb, exp, context) => {
        throw new Error(`Temporal.PlainDate.valueOf: not supported`);
    });


    /**
     * Temporal.PlainTime
     * TODO: since, until
     */
    relationalQueryTranslator.registerMethod(Temporal.PlainTime, "from", (qb, exp, context) => `TIME ${qb.toString(exp.params[0], context)}`);

    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "hour", (qb, exp, context) => `EXTRACT(HOUR FROM ${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "minute", (qb, exp, context) => `EXTRACT(MINUTE FROM ${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "second", (qb, exp, context) => `EXTRACT(SECOND FROM ${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "millisecond", (qb, exp, context) => `FLOOR(EXTRACT(MILLISECOND FROM ${qb.toString(exp.objectOperand, context)}))`);
    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "microsecond", (qb, exp, context) => `FLOOR(EXTRACT(MICROSECOND FROM ${qb.toString(exp.objectOperand, context)}))`);
    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "nanosecond", (qb, exp, context) => `FLOOR(EXTRACT(MICROSECOND FROM ${qb.toString(exp.objectOperand, context)})* 1000)`);

    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "toString", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'HH24:MI:SS.US')`);
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "toJSON", (qb, exp, context) => `TO_CHAR(${qb.toString(exp.objectOperand, context)}, 'HH24:MI:SS.US')`);
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "add", (qb, exp, context) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
        const intervalParams = [] as string[];
        if (paramExp.object.years) {
            intervalParams.push(`years => ${qb.toString(paramExp.object.years, context)}`);
        }
        if (paramExp.object.months) {
            intervalParams.push(`months => ${qb.toString(paramExp.object.months, context)}`);
        }
        if (paramExp.object.weeks) {
            intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, context)}`);
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
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, context)} + make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "subtract", (qb, exp, context) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
        const intervalParams = [] as string[];
        if (paramExp.object.years) {
            intervalParams.push(`years => ${qb.toString(paramExp.object.years, context)}`);
        }
        if (paramExp.object.months) {
            intervalParams.push(`months => ${qb.toString(paramExp.object.months, context)}`);
        }
        if (paramExp.object.weeks) {
            intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, context)}`);
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
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, context)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, context)}) - make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "equals", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)})=${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "with", (qb, exp, context) => {
        if (exp.params.length !== 1) {
            throw Error("Temporal.PlainDate.with: only support info");
        }
        const paramInfoExp = exp.params[0] as ObjectValueExpression<Temporal.PlainTimeLike>;
        const objectQ = qb.toString(exp.objectOperand, context);
        let hourQ = `EXTRACT(HOUR FROM ${objectQ})`;
        if (paramInfoExp.object.hour) {
            hourQ = `COALESCE(${qb.toString(paramInfoExp.object.hour, context)}, ${hourQ})`;
        }
        let minuteQ = `EXTRACT(MINUTE FROM ${objectQ})`;
        if (paramInfoExp.object.minute) {
            minuteQ = `COALESCE(${qb.toString(paramInfoExp.object.minute, context)}, ${minuteQ})`;
        }
        let secondQ = `EXTRACT(SECOND FROM ${objectQ})`;
        const secondParts = [] as string[];
        if (paramInfoExp.object.second) {
            secondParts.push(qb.toString(paramInfoExp.object.second, context));
        }
        if (paramInfoExp.object.millisecond) {
            secondParts.push(`${qb.toString(paramInfoExp.object.second, context)}/1000.0`);
        }
        if (paramInfoExp.object.microsecond) {
            secondParts.push(`${qb.toString(paramInfoExp.object.second, context)}/1000000.0`);
        }
        if (paramInfoExp.object.nanosecond) {
            secondParts.push(`${qb.toString(paramInfoExp.object.second, context)}/1000000000.0`);
        }
        if (secondParts.length) {
            secondQ = `COALESCE(${secondParts.join("+")}, ${secondQ})`;
        }

        return `MAKE_TIME(CAST(${hourQ} as int), CAST(${minuteQ} as int), ${secondQ})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "round", (qb, exp, context) => {
        let smallestUnitParam: IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>> = undefined;
        if (exp.params[0] instanceof ObjectValueExpression) {
            const paramExp = exp.params[0] as ObjectValueExpression<Exclude<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
            if (paramExp.object.roundingMode) {
                throw new Error(`Temporal.PlainTime.round: roundingMode not supported`);
            }
            if (paramExp.object.roundingIncrement) {
                throw new Error(`Temporal.PlainTime.round: roundingIncrement not supported`);
            }
            if (paramExp.object.smallestUnit) {
                smallestUnitParam = paramExp.object.smallestUnit as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
            }
        }
        else {
            smallestUnitParam = exp.params[0] as IExpression<Extract<Temporal.RoundTo<'hour' | 'minute' | 'second' | 'millisecond' | 'microsecond' | 'nanosecond'>, string>>;
        }
        return `DATE_TRUNC(${qb.toString(smallestUnitParam, context)}, ${qb.toString(exp.objectOperand, context)})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "valueOf", (qb, exp, context) => {
        throw new Error(`Temporal.PlainDate.valueOf: not supported`);
    });


    /**
     * Temporal.Now
     * TODO: timeZoneId()
     */
    relationalQueryTranslator.registerMethod(Temporal.Now, "instant", (qb, exp, context) => `CURRENT_TIMESTAMP`);
    relationalQueryTranslator.registerMethod(Temporal.Now, "plainDateISO", (qb, exp, context) => {
        if (!exp.params.length) {
            return `CURRENT_DATE`;
        }

        return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], context)} as DATE)`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Now, "plainDateTimeISO", (qb, exp, context) => {
        if (!exp.params.length) {
            return `CAST(CURRENT_TIMESTAMP as TIMESTAMP)`;
        }

        return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], context)} as TIMESTAMP)`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Now, "plainTimeISO", (qb, exp, context) => {
        if (!exp.params.length) {
            return `CURRENT_TIME`;
        }

        return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], context)} as TIME)`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Now, "zonedDateTimeISO", (qb, exp, context) => {
        if (!exp.params.length) {
            return `CURRENT_TIMESTAMP`;
        }

        return `CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], context)}`;
    });
}

if (Decimal) {
    relationalQueryTranslator.registerValue(Decimal, (val) => val.toFixed());
    relationalQueryTranslator.registerColumnType(Decimal, { columnType: "decimal", option: { precision: 18, scale: 6 }, group: "Decimal" });

    /**
     * Decimal
     * TODO: toSD, toSignificantDigits, static methods
     */
    relationalQueryTranslator.registerConstructor(Decimal, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} as NUMERIC)`, o => o.params.length === 1);
    relationalQueryTranslator.registerFn(Decimal, (qb, exp, context) => `CAST(${qb.toString(exp.params[0], context)} as NUMERIC)`, o => o.params.length === 1);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "plus", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}+${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "add", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}+${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "minus", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}-${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "sub", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}-${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "times", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}*${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "mul", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}*${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "div", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "dividedBy", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "pow", (qb, exp, context) => `POWER(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "toPower", (qb, exp, context) => `POWER(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "neg", (qb, exp, context) => `-${qb.toString(exp.objectOperand, context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "negated", (qb, exp, context) => `-${qb.toString(exp.objectOperand, context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "abs", (qb, exp, context) => `ABS(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "absoluteValue", (qb, exp, context) => `ABS(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "mod", (qb, exp, context) => `MOD(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "modulo", (qb, exp, context) => `MOD(${qb.toString(exp.objectOperand, context)},${qb.toString(exp.params[0], context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "sqrt", (qb, exp, context) => `SQRT(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "squareRoot", (qb, exp, context) => `SQRT(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cbrt", (qb, exp, context) => `CBRT(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cubeRoot", (qb, exp, context) => `CBRT(${qb.toString(exp.objectOperand, context)})`);

    relationalQueryTranslator.registerMethod(Decimal.prototype, "eq", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}=${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "equals", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}=${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "lt", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "lessThan", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "lte", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<=${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "lessThanOrEqualTo", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<=${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "gt", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "greaterThan", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "gte", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>=${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "greaterThanOrEqualTo", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>=${qb.toString(exp.params[0], context)}`);

    relationalQueryTranslator.registerMethod(Decimal.prototype, "round", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "floor", (qb, exp, context) => `FLOOR(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "ceil", (qb, exp, context) => `CEILING(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "trunc", (qb, exp, context) => `TRUNC(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "truncated", (qb, exp, context) => `TRUNC(${qb.toString(exp.objectOperand, context)})`);

    relationalQueryTranslator.registerMethod(Decimal.prototype, "sin", (qb, exp, context) => `SIN(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "sine", (qb, exp, context) => `SIN(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cos", (qb, exp, context) => `COS(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cosine", (qb, exp, context) => `COS(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "tan", (qb, exp, context) => `TAN(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "tangent", (qb, exp, context) => `TAN(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "asin", (qb, exp, context) => `ASIN(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseSine", (qb, exp, context) => `ASIN(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "acos", (qb, exp, context) => `ACOS(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseCosine", (qb, exp, context) => `ACOS(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "atan", (qb, exp, context) => `ATAN(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseTangent", (qb, exp, context) => `ATAN(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "sinh", (qb, exp, context) => `SINH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "hyperbolicSine", (qb, exp, context) => `SINH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cosh", (qb, exp, context) => `COSH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "hyperbolicCosine", (qb, exp, context) => `COSH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "tanh", (qb, exp, context) => `TANH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "hyperbolicTangent", (qb, exp, context) => `TANH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "asinh", (qb, exp, context) => `ASINH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseHyperbolicSine", (qb, exp, context) => `ASINH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "acosh", (qb, exp, context) => `ACOSH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseHyperbolicCosine", (qb, exp, context) => `ACOSH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "atanh", (qb, exp, context) => `ATANH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseHyperbolicTangent", (qb, exp, context) => `ATANH(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "exp", (qb, exp, context) => `EXP(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "naturalExponential", (qb, exp, context) => `EXP(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "ln", (qb, exp, context) => `LN(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "naturalLogarithm", (qb, exp, context) => `LN(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "log", (qb, exp, context) => `LOG(${qb.toString(exp.objectOperand, context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "logarithm", (qb, exp, context) => `LOG(${qb.toString(exp.objectOperand, context)})`);

    relationalQueryTranslator.registerMethod(Decimal.prototype, "clamp", (qb, exp, context) => `LEAST(GREATEST(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)}), ${qb.toString(exp.params[1], context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "clampedTo", (qb, exp, context) => `LEAST(GREATEST(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)}), ${qb.toString(exp.params[1], context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "divToInt", (qb, exp, context) => `FLOOR(${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "dividedToIntegerBy", (qb, exp, context) => `FLOOR(${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "toDP", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)})`, o => o.params.length === 1);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "toDecimalPlaces", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)}, ${qb.toString(exp.params[0], context)})`, o => o.params.length === 1);

    relationalQueryTranslator.registerMethod(Decimal.prototype, "toNumber", (qb, exp, context) => `CAST(${qb.toString(exp.objectOperand, context)} as DOUBLE PRECISION)`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "toNearest", (qb, exp, context) => `ROUND(${qb.toString(exp.objectOperand, context)}/${qb.toString(exp.params[0], context)})*${qb.toString(exp.params[0], context)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "toPrecision", (qb, exp, context) => {
        const ob = qb.toString(exp.objectOperand, context);
        const paramQ = exp.params.length ? qb.toString(exp.params[0], context) : "0";
        return `CASE WHEN ${ob}=0 THEN 0
ELSE ROUND(${ob}, ${paramQ} - FLOOR(LOG(10, ABS(${ob}))) - 1)
END`;
    });
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cmp", (qb, exp, context) => {
        const obQ = qb.toString(exp.objectOperand, context);
        const paramQ = qb.toString(exp.params[0], context);
        return `CASE WHEN ${obQ}<${paramQ} THEN -1 WHEN ${obQ}>${paramQ} THEN 1 ELSE 0 END`;
    }, o => o.params.length === 1);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "comparedTo", (qb, exp, context) => {
        const obQ = qb.toString(exp.objectOperand, context);
        const paramQ = qb.toString(exp.params[0], context);
        return `CASE WHEN ${obQ}<${paramQ} THEN -1 WHEN ${obQ}>${paramQ} THEN 1 ELSE 0 END`;
    }, o => o.params.length === 1);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "decimalPlaces", (qb, exp, context) => {
        const obQ = qb.toString(exp.objectOperand, context);
        return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE CHAR_LENGTH(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
    });
    relationalQueryTranslator.registerMethod(Decimal.prototype, "dp", (qb, exp, context) => {
        const obQ = qb.toString(exp.objectOperand, context);
        return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE CHAR_LENGTH(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
    });
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isInt", (qb, exp, context) => {
        const obQ = qb.toString(exp.objectOperand, context);
        return `${obQ}=TRUNC(${obQ})`;
    });
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isInteger", (qb, exp, context) => {
        const obQ = qb.toString(exp.objectOperand, context);
        return `${obQ}=TRUNC(${obQ})`;
    });
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isNeg", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<0`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isNegative", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}<0`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isPos", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>0`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isPositive", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}>0`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isZero", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)}=0`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isFinite", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)} ~ '^-?[0-9]+(\.[0-9]+)?$'`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isNaN", (qb, exp, context) => `${qb.toString(exp.objectOperand, context)} !~ '^-?[0-9]+(\.[0-9]+)?$'`);

    relationalQueryTranslator.registerMethod(Decimal, "random", (qb, exp, context) => {
        if (!exp.params.length) {
            return `RANDOM()`;
        }
        const paramQ = qb.toString(exp.params[0], context);
        return `FLOOR(RANDOM()* 10^${paramQ})/10^${paramQ}`;
    });
}