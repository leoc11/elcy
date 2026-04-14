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
import { isEntityExp, isNonNullExp } from "src/Helper/Util";
import { NullCoalesceExpression } from "src/ExpressionBuilder/Expression/NullCoalesceExpression";

export const relationalQueryTranslator = new QueryTranslator(Symbol("relational"));

//#region Function

relationalQueryTranslator.registerFn(parseInt, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS INT)`);
relationalQueryTranslator.registerFn(parseFloat, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS FLOAT)`);
relationalQueryTranslator.registerFn(isNaN, (qb, exp, param) => `ISNUMERIC(${qb.toString(exp.params[0], param)}) = 0`);
relationalQueryTranslator.registerFn(Number, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS DOUBLE PRECISION)`);
relationalQueryTranslator.registerFn(String, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS nvarchar(max))`);
relationalQueryTranslator.registerFn(Boolean, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} AS boolean)`);
relationalQueryTranslator.registerFn(BigInt, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} as BIGINT)`);

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
relationalQueryTranslator.registerMember(String.prototype, "length", (qb, exp, param) => `CHAR_LENGTH(${qb.toString(exp.objectOperand, param)})`);

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
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "every" as any, (qb, exp, param) => `NOT EXIST(${qb.newLine(1) + qb.toString(exp.objectOperand, param) + qb.newLine(-1)})`);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "some" as any, (qb, exp, param) => `EXIST(${qb.newLine(1) + qb.toString(exp.objectOperand, param) + qb.newLine(-1)})`);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "count" as any, (qb, exp, param) => `COUNT(${exp.params.length && isEntityExp(exp.params[0]) ? `${qb.toString(exp.params[0], param)}.*` : "*"})`);
const aggregateTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, param: IQueryBuilderContext) => `${exp.methodName.toUpperCase()}(${qb.toString(exp.params[0], param)})`;
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "sum" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "min" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "max" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "avg" as any, aggregateTranslator);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "join" as any, (qb, exp, param) => `STRING_AGG(${qb.toString(exp.params[0], param)}, ${qb.toString(exp.params[1], param)})`);
relationalQueryTranslator.registerMethod(SelectExpression.prototype, "includes" as any, (qb, exp, param) => `${qb.toString(exp.params[0], param)} IN (${qb.newLine(1, true)}${qb.toString(exp.objectOperand, param)}${qb.newLine(-1, true)})`);

/**
 * Array
 * TODO: contains,concat,copyWithin,every,fill,filter,find,findIndex,forEach,indexOf,join,lastIndexOf,map,pop,push,reduce,reduceRight,reverse,shift,slice,some,sort,splice,toString,unshift,valueOf
 */
relationalQueryTranslator.registerMethod(Array.prototype, "includes", (qb, exp, param) => `${qb.toString(exp.params[0], param)} IN ${qb.toString(exp.objectOperand, param)}`);

/**
 * Enumerable
 * TODO: contains,concat,copyWithin,every,fill,filter,find,findIndex,forEach,indexOf,join,lastIndexOf,map,pop,push,reduce,reduceRight,reverse,shift,slice,some,sort,splice,toString,unshift,valueOf
 */
relationalQueryTranslator.registerMethod(Enumerable.prototype, "includes", (qb, exp, param) => `${qb.toString(exp.params[0], param)} IN (${qb.newLine(1, true)}${qb.toString(exp.objectOperand, param)}${qb.newLine(-1, true)})`);

/**
 * Math
 * TODO: max,min,acosh,asinh,atanh,cbrt,clz32,fround,imul
 */
const trigonoTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, param: IQueryBuilderContext) => `${exp.methodName.toUpperCase()}(${qb.toString(exp.params[0], param)})`;
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
relationalQueryTranslator.registerMethod(Math, "ceil", (qb, exp, param) => `CEIL(${qb.toString(exp.params[0], param)})`);
relationalQueryTranslator.registerMethod(Math, "atan2", (qb, exp, param) => `ATN2(${qb.toString(exp.params[0], param)}, ${qb.toString(exp.params[1], param)})`);
relationalQueryTranslator.registerMethod(Math, "pow", (qb, exp, param) => `POWER(${qb.toString(exp.params[0], param)}, ${qb.toString(exp.params[1], param)})`);
relationalQueryTranslator.registerMethod(Math, "random", () => "RAND()", () => true);
relationalQueryTranslator.registerMethod(Math, "round", (qb, exp, param) => `ROUND(${qb.toString(exp.params[0], param)}, 0)`);
relationalQueryTranslator.registerMethod(Math, "expm1", (qb, exp, param) => `(EXP(${qb.toString(exp.params[0], param)}) - 1)`);
relationalQueryTranslator.registerMethod(Math, "hypot", (qb, exp, param) => `SQRT(${exp.params.map((p) => `POWER(${qb.toString(p, param)}, 2)`).join(" + ")})`);
relationalQueryTranslator.registerMethod(Math, "log1p", (qb, exp, param) => `LOG(1 + ${qb.toString(exp.params[0], param)})`);
relationalQueryTranslator.registerMethod(Math, "log2", (qb, exp, param) => `LOG(${qb.toString(exp.params[0], param)}, 2)`);
relationalQueryTranslator.registerMethod(Math, "sinh", (qb, exp, param) => `((EXP(${qb.toString(exp.params[0], param)}) - EXP(-${qb.toString(exp.params[0], param)})) / 2)`);
relationalQueryTranslator.registerMethod(Math, "cosh", (qb, exp, param) => `((EXP(${qb.toString(exp.params[0], param)}) + EXP(-${qb.toString(exp.params[0], param)})) / 2)`);
relationalQueryTranslator.registerMethod(Math, "tanh", (qb, exp, param) => `((EXP(2 * ${qb.toString(exp.params[0], param)}) - 1) / (EXP(2 * ${qb.toString(exp.params[0], param)}) + 1))`);
relationalQueryTranslator.registerMethod(Math, "trunc", (qb, exp, param) => `(${qb.toString(exp.params[0], param)} | 0)`);
relationalQueryTranslator.registerMethod(Math, "max", (qb, exp, param) => {
    if (exp.params.length <= 0) {
        throw new Error(`${exp.toString()} require at least one parameter`);
    }
    return `GREATEST(${exp.params.map((o) => qb.toString(o, param)).join(",")})`;
});
relationalQueryTranslator.registerMethod(Math, "min", (qb, exp, param) => {
    if (exp.params.length <= 0) {
        throw new Error(`${exp.toString()} require at least one parameter`);
    }
    return `LEAST(${exp.params.map((o) => qb.toString(o, param)).join(",")})`;
});
/**
 * String
 * TODO: localeCompare,match,normalize,padEnd,padStart,search,slice
 */
relationalQueryTranslator.registerMethod(String.prototype, "charAt", (qb, exp, param) => `SUBSTRING(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)} + 1, 1)`);
relationalQueryTranslator.registerMethod(String.prototype, "charCodeAt", (qb, exp, param) => `UNICODE(SUBSTRING(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)} + 1, 1))`);
relationalQueryTranslator.registerMethod(String.prototype, "concat", (qb, exp, param) => `CONCAT(${qb.toString(exp.objectOperand, param)}, ${exp.params.map((p) => qb.toString(p, param)).join(", ")})`);
relationalQueryTranslator.registerMethod(String.prototype, "endsWith", (qb, exp, param) => `(${qb.toString(exp.objectOperand, param)} LIKE CONCAT(${qb.valueString("%")}, ${qb.toString(exp.params[0], param)}))`);
relationalQueryTranslator.registerMethod(String.prototype, "includes", (qb, exp, param) =>
    exp.params.length > 1
        ? `(${qb.toString(exp.params[0], param)} + RIGHT(${qb.toString(exp.objectOperand, param)}, (CHAR_LENGTH(${qb.toString(exp.objectOperand, param)}) - ${qb.toString(exp.params[0], param)})))`
        : `(${qb.toString(exp.objectOperand, param)} LIKE CONCAT(${qb.valueString("%")}, ${qb.toString(exp.params[0], param)}, ${qb.valueString("%")}))`);
relationalQueryTranslator.registerMethod(String.prototype, "indexOf", (qb, exp, param) => `(CHARINDEX(${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param) + (exp.params.length > 1 ? `, ${qb.toString(exp.params[1], param)}` : "")}) - 1)`);
relationalQueryTranslator.registerMethod(String.prototype, "lastIndexOf", (qb, exp, param) => `(CHAR_LENGTH(${qb.toString(exp.objectOperand, param)}) - CHARINDEX(${qb.toString(exp.params[0], param)}, REVERSE(${qb.toString(exp.objectOperand, param)})${(exp.params.length > 1 ? `, ${qb.toString(exp.params[1], param)}` : "")}))`);
relationalQueryTranslator.registerMethod(String.prototype, "repeat", (qb, exp, param) => `REPLICATE(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)})`);
relationalQueryTranslator.registerMethod(String.prototype, "replace", (qb, exp, param) => `REPLACE(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.params[1], param)})`);
relationalQueryTranslator.registerMethod(String.prototype, "split", (qb, exp, param) => `STRING_SPLIT(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)})`);
relationalQueryTranslator.registerMethod(String.prototype, "startsWith", (qb, exp, param) => `(${qb.toString(exp.objectOperand, param)} LIKE CONCAT(${qb.toString(exp.params[0], param)}, ${qb.valueString("%")}))`);
relationalQueryTranslator.registerMethod(String.prototype, "substr", (qb, exp, param) => `SUBSTRING(${qb.toString(exp.objectOperand, param)}, (${qb.toString(exp.params[0], param)} + 1), ${(exp.params.length > 1 ? qb.toString(exp.params[1], param) : "8000")})`);
relationalQueryTranslator.registerMethod(String.prototype, "substring", (qb, exp, param) => `SUBSTRING(${qb.toString(exp.objectOperand, param)}, (${qb.toString(exp.params[0], param)} + 1), ${(exp.params.length > 1 ? `(${qb.toString(exp.params[1], param)} - ${qb.toString(exp.params[0], param)})` : "8000")})`);
const tolowerTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, param: IQueryBuilderContext) => `LOWER(${qb.toString(exp.objectOperand, param)})`;
relationalQueryTranslator.registerMethod(String.prototype, "toLowerCase", tolowerTranslator);
relationalQueryTranslator.registerMethod(String.prototype, "toLocaleLowerCase", tolowerTranslator);
const toupperTranslator = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, param: IQueryBuilderContext) => `UPPER(${qb.toString(exp.objectOperand, param)})`;
relationalQueryTranslator.registerMethod(String.prototype, "toUpperCase", toupperTranslator);
relationalQueryTranslator.registerMethod(String.prototype, "toLocaleUpperCase", toupperTranslator);
const stringValueOf = <T>(qb: IQueryBuilder, exp: MethodCallExpression<T>, param: IQueryBuilderContext) => qb.toString(exp.objectOperand, param);
relationalQueryTranslator.registerMethod(String.prototype, "toString", stringValueOf);
relationalQueryTranslator.registerMethod(String.prototype, "valueOf", stringValueOf);
relationalQueryTranslator.registerMethod(String.prototype, "trim", (qb, exp, param) => `RTRIM(LTRIM(${qb.toString(exp.objectOperand, param)}))`);

/**
 * Number
 * TODO: isFinite,isInteger,isNaN,isSafeInteger, toLocaleString,toExponential,toFixed,toPrecision
 */
relationalQueryTranslator.registerMethod(Number.prototype, "toString", (qb, exp, param) => `CAST(${qb.toString(exp.objectOperand, param)} AS nvarchar(255))`);
relationalQueryTranslator.registerMethod(Number.prototype, "valueOf", (qb, exp, param) => qb.toString(exp.objectOperand, param));
relationalQueryTranslator.registerMethod(Number.prototype, "toFixed", (qb, exp, param) => `ROUND(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)})`, o => o.params.length === 1);
relationalQueryTranslator.registerMethod(Number.prototype, "toPrecision", (qb, exp, param) => {
    const ob = qb.toString(exp.objectOperand, param);
    const paramQ = exp.params.length ? qb.toString(exp.params[0], param) : "0";
    return `CASE WHEN ${ob}=0 THEN 0
ELSE ROUND(${ob}, ${paramQ} - FLOOR(LOG(10, ABS(${ob}))) - 1)
END`;
});

/**
 * BigInt
 * TODO: toLocaleString
 */
relationalQueryTranslator.registerMethod(BigInt.prototype, "toString", (qb, exp, param) => `CAST(${qb.toString(exp.objectOperand, param)} AS nvarchar(max))`);
relationalQueryTranslator.registerMethod(BigInt.prototype, "valueOf", (qb, exp, param) => qb.toString(exp.objectOperand, param));

/**
 * Symbol
 * TODO: toString
 */

/**
 * Boolean
 * TODO:
 */
relationalQueryTranslator.registerMethod(Boolean.prototype, "toString" as any, (qb, exp, param) => `(CASE WHEN (${qb.toString(exp.objectOperand, param)}) THEN ${qb.valueString("true")} ELSE ${qb.valueString("false")} END)`);

/**
 * Date
 * TODO: getTime,getTimezoneOffset,getUTCDate,getUTCDay,getUTCFullYear,getUTCHours,getUTCMilliseconds,getUTCMinutes,getUTCMonth,getUTCSeconds,getYear,setTime,setUTCDate,setUTCFullYear,setUTCHours,setUTCMilliseconds,setUTCMinutes,setUTCMonth,setUTCSeconds,toJSON,toISOString,toLocaleDateString,toLocaleTimeString,toLocaleString,toString,valueOf,toTimeString,toUTCString,toGMTString
 */
relationalQueryTranslator.registerMethod(Date.prototype, "getDate", (qb, exp, param) => `DAY(${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getDay", (qb, exp, param) => `(DATEPART(weekday, ${qb.toString(exp.objectOperand, param)}) - 1)`);
relationalQueryTranslator.registerMethod(Date.prototype, "getFullYear", (qb, exp, param) => `YEAR(${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getHours", (qb, exp, param) => `DATEPART(hour, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getMinutes", (qb, exp, param) => `DATEPART(minute, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getMonth", (qb, exp, param) => `(MONTH(${qb.toString(exp.objectOperand, param)}) - 1)`);
relationalQueryTranslator.registerMethod(Date.prototype, "getSeconds", (qb, exp, param) => `DATEPART(second, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "getMilliseconds", (qb, exp, param) => `DATEPART(millisecond, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setDate", (qb, exp, param) => `DATEADD(DAY, (${qb.toString(exp.params[0], param)} - DAY(${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setFullYear", (qb, exp, param) => `DATEADD(YYYY, (${qb.toString(exp.params[0], param)} - YEAR(${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setHours", (qb, exp, param) => `DATEADD(HH, (${qb.toString(exp.params[0], param)} - DATEPART(hour, ${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setMilliseconds", (qb, exp, param) => `DATEADD(MS, (${qb.toString(exp.params[0], param)} - DATEPART(millisecond, ${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setMinutes", (qb, exp, param) => `DATEADD(MI, (${qb.toString(exp.params[0], param)} - DATEPART(minute, ${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setMonth", (qb, exp, param) => `DATEADD(MM, (${qb.toString(exp.params[0], param)} - (MONTH(${qb.toString(exp.objectOperand, param)}) - 1)), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "setSeconds", (qb, exp, param) => `DATEADD(SS, (${qb.toString(exp.params[0], param)} - DATEPART(second, ${qb.toString(exp.objectOperand, param)})), ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "toDateString", (qb, exp, param) => `CONCAT(LEFT(DATENAME(WEEKDAY, ${qb.toString(exp.objectOperand, param)}), 3), ${qb.valueString(" ")}, LEFT(DATENAME(MONTH, ${qb.toString(exp.objectOperand, param)}), 3), ${qb.valueString(" ")}, RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.toString(exp.objectOperand, param)}))), 2), ${qb.valueString(" ")}, RIGHT(CONCAT(${qb.valueString("0")}, RTRIM(MONTH(${qb.toString(exp.objectOperand, param)}))), 2))`);
relationalQueryTranslator.registerMethod(Date.prototype, "addDays", (qb, exp, param) => `DATEADD(DAY, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addMonths", (qb, exp, param) => `DATEADD(MM, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addYears", (qb, exp, param) => `DATEADD(YYYY, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addHours", (qb, exp, param) => `DATEADD(HH, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addMinutes", (qb, exp, param) => `DATEADD(MI, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addSeconds", (qb, exp, param) => `DATEADD(SS, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);
relationalQueryTranslator.registerMethod(Date.prototype, "addMilliseconds", (qb, exp, param) => `DATEADD(MS, ${qb.toString(exp.params[0], param)}, ${qb.toString(exp.objectOperand, param)})`);

/**
 * RegExp
 * TODO: exec,toString
 */
relationalQueryTranslator.registerMethod(RegExp.prototype, "test", (qb, exp, param) => `${qb.toString(exp.params[0], param)} REGEXP ${qb.toString(exp.objectOperand, param)}`);

/**
 * Function
 * TODO: apply,bind,call,toSource,toString
 */

//#endregion

//#region Operator

// http://dataeducation.com/bitmask-handling-part-4-left-shift-and-right-shift/
// TypeofExpression,BitwiseSignedRightShiftExpression, BitwiseZeroRightShiftExpression
// BitwiseZeroLeftShiftExpression,InstanceofExpression
const aritAssignmentTranlator = <T>(qb: IQueryBuilder, exp: IBinaryOperatorExpression<T>, operator: string, param: IQueryBuilderContext) => {
    if (!(exp.leftOperand instanceof ParameterExpression)) {
        throw new Error(`Operator ${exp.toString()} only support parameter for left operand`);
    }
    const varString = qb.toString(exp.leftOperand, param);
    return `${varString} = ${varString}${operator}${qb.toOperandString(exp.rightOperand, param)}`;
};
relationalQueryTranslator.registerOperator(AdditionAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "+", param));
relationalQueryTranslator.registerOperator(SubstractionAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "-", param));
relationalQueryTranslator.registerOperator(MultiplicationAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "*", param));
relationalQueryTranslator.registerOperator(DivisionAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "/", param));
relationalQueryTranslator.registerOperator(ExponentiationAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "**", param));
relationalQueryTranslator.registerOperator(ModulusAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "%", param));
relationalQueryTranslator.registerOperator(BitwiseAndAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "&", param));
relationalQueryTranslator.registerOperator(BitwiseOrAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "|", param));
relationalQueryTranslator.registerOperator(BitwiseXorAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "^", param));
relationalQueryTranslator.registerOperator(BitwiseZeroLeftShiftAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, "<<", param));
relationalQueryTranslator.registerOperator(BitwiseZeroRightShiftAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, ">>", param));
relationalQueryTranslator.registerOperator(BitwiseSignedRightShiftAssignmentExpression, (qb, exp, param) => aritAssignmentTranlator(qb, exp, ">>>", param));

const incrementTranslator = (qb: IQueryBuilder, exp: IUnaryOperatorExpression, operator: string, param: IQueryBuilderContext) => {
    if (!(exp.operand instanceof ParameterExpression)) {
        throw new Error(`Operator ${exp.toString()} only support parameter operand`);
    }
    const varString = qb.toString(exp.operand, param);
    return `${varString} = ${varString}${operator}${qb.valueString(1)}`;
};
relationalQueryTranslator.registerOperator(LeftIncrementExpression, (qb, exp, param) => incrementTranslator(qb, exp, "+", param));
relationalQueryTranslator.registerOperator(LeftDecrementExpression, (qb, exp, param) => incrementTranslator(qb, exp, "-", param));
relationalQueryTranslator.registerOperator(RightIncrementExpression, (qb, exp, param) => `(${incrementTranslator(qb, exp, "+", param)}) - 1`);
relationalQueryTranslator.registerOperator(RightDecrementExpression, (qb, exp, param) => `(${incrementTranslator(qb, exp, "-", param)}) + 1`);

const binaryTranslator = <T>(qb: IQueryBuilder, exp: IBinaryOperatorExpression<T>, operator: string, param: IQueryBuilderContext) => `${qb.toOperandString(exp.leftOperand, param)}${operator}${qb.toOperandString(exp.rightOperand, param)}`;
relationalQueryTranslator.registerOperator(AssignmentExpression, (qb, exp, param) => binaryTranslator(qb, exp, "=", param));
relationalQueryTranslator.registerOperator(GreaterEqualExpression, (qb, exp, param) => binaryTranslator(qb, exp, ">=", param));
relationalQueryTranslator.registerOperator(GreaterThanExpression, (qb, exp, param) => binaryTranslator(qb, exp, ">", param));
relationalQueryTranslator.registerOperator(LessEqualExpression, (qb, exp, param) => binaryTranslator(qb, exp, "<=", param));
relationalQueryTranslator.registerOperator(LessThanExpression, (qb, exp, param) => binaryTranslator(qb, exp, "<", param));
relationalQueryTranslator.registerOperator(ModulusExpression, (qb, exp, param) => binaryTranslator(qb, exp, "%", param));
relationalQueryTranslator.registerOperator(SubstractionExpression, (qb, exp, param) => binaryTranslator(qb, exp, "-", param));
relationalQueryTranslator.registerOperator(MultiplicationExpression, (qb, exp, param) => binaryTranslator(qb, exp, "*", param));
relationalQueryTranslator.registerOperator(DivisionExpression, (qb, exp, param) => binaryTranslator(qb, exp, "/", param));
relationalQueryTranslator.registerOperator(AdditionExpression, (qb, exp, param) => {
    if (exp.type === String) {
        return `CONCAT(${qb.toOperandString(exp.leftOperand, param)}, ${qb.toOperandString(exp.rightOperand, param)})`;
    }

    return `${qb.toOperandString(exp.leftOperand, param)}+${qb.toOperandString(exp.rightOperand, param)}`;
});
relationalQueryTranslator.registerOperator(BitwiseAndExpression, (qb, exp, param) => binaryTranslator(qb, exp, "&", param));
relationalQueryTranslator.registerOperator(BitwiseOrExpression, (qb, exp, param) => binaryTranslator(qb, exp, "|", param));
relationalQueryTranslator.registerOperator(BitwiseXorExpression, (qb, exp, param) => binaryTranslator(qb, exp, "^", param));

const equalTranslator = (qb: IQueryBuilder, exp: IBinaryOperatorExpression, param: IQueryBuilderContext) => {
    const leftExpString = qb.toOperandString(exp.leftOperand, param);
    const rightExpString = qb.toOperandString(exp.rightOperand, param);
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
const notEqualTranslator = (qb: IQueryBuilder, exp: NotEqualExpression | StrictNotEqualExpression, param: IQueryBuilderContext) => {
    const leftExpString = qb.toOperandString(exp.leftOperand, param);
    const rightExpString = qb.toOperandString(exp.rightOperand, param);
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

relationalQueryTranslator.registerOperator(OrExpression, (qb, exp, param) => `${qb.toLogicalString(exp.leftOperand, param)} OR ${qb.toLogicalString(exp.rightOperand, param)}`);
relationalQueryTranslator.registerOperator(AndExpression, (qb, exp, param) => `${qb.toLogicalString(exp.leftOperand, param)} AND ${qb.toLogicalString(exp.rightOperand, param)}`);
relationalQueryTranslator.registerOperator(NotExpression, (qb, exp, param) => `NOT(${qb.newLine(1)}${qb.toLogicalString(exp.operand, param)}${qb.newLine(-1)})`);
relationalQueryTranslator.registerOperator(BitwiseNotExpression, (qb, exp, param) => `~(${qb.toOperandString(exp.operand, param)})`);
relationalQueryTranslator.registerOperator(TernaryExpression, (qb, exp, param) => `(${qb.newLine(1)}CASE WHEN (${qb.toString(exp.logicalOperand, param)}) ${qb.newLine()}THEN ${qb.toOperandString(exp.trueOperand, param)}${qb.newLine()}ELSE ${qb.toOperandString(exp.falseOperand, param)}${qb.newLine()}END${qb.newLine(-1)})`);
relationalQueryTranslator.registerOperator(NullCoalesceExpression, (qb, exp, param) => `COALESCE(${qb.toString(exp.leftOperand, param)}, ${qb.toString(exp.rightOperand, param)})`);

//#endregion

relationalQueryTranslator.registerMethod(DbFunction, "like", (qb, exp, param) => {
    let escape = "";
    if (exp.params.length > 2) {
        escape = ` ESCAPE ${qb.toString(exp.params[2], param)}`;
    }

    return `(${qb.toString(exp.params[0], param)} LIKE ${qb.toString(exp.params[1], param)}${escape})`;
});
relationalQueryTranslator.registerMethod(DbFunction, "timestamp", () => "CURRENT_TIMESTAMP", () => true);
relationalQueryTranslator.registerMethod(DbFunction, "utcTimestamp", () => "CURRENT_TIMESTAMP AT TIME ZONE 'UTC'", () => true);

if (Temporal) {
    /**
     * Temporal.Instant
     * TODO: since, until
     */

    relationalQueryTranslator.registerMethod(Temporal.Instant, "compare", (qb, exp, param) => {
        const param1 = qb.toString(exp.params[0], param);
        const param2 = qb.toString(exp.params[2], param);
        return `CASE WHEN ${param1}<${param2} THEN -1 WHEN ${param1}>${param2} THEN 1 ELSE 0 END`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainDate, "compare", (qb, exp, param) => {
        const param1 = qb.toString(exp.params[0], param);
        const param2 = qb.toString(exp.params[2], param);
        return `CASE WHEN ${param1}<${param2} THEN -1 WHEN ${param1}>${param2} THEN 1 ELSE 0 END`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainTime, "compare", (qb, exp, param) => {
        const param1 = qb.toString(exp.params[0], param);
        const param2 = qb.toString(exp.params[2], param);
        return `CASE WHEN ${param1}<${param2} THEN -1 WHEN ${param1}>${param2} THEN 1 ELSE 0 END`;
    });

    relationalQueryTranslator.registerMethod(Temporal.Instant, "from", (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} as TIMESTAMP WITH TIME ZONE)`);
    relationalQueryTranslator.registerMethod(Temporal.Instant, "fromEpochMilliseconds", (qb, exp, param) => {
        const value = param.parameters.get(exp.params[0] as SqlParameterExpression)?.value as number;
        return `TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00 UTC' + INTERVAL ${qb.toString(new ValueExpression(`${value / 1_000} SECOND`), param)}`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Instant, "fromEpochNanoseconds", (qb, exp, param) => {
        const value = param.parameters.get(exp.params[0] as SqlParameterExpression)?.value as number;
        return `TIMESTAMP WITH TIME ZONE '1970-01-01 00:00:00 UTC' + INTERVAL ${qb.toString(new ValueExpression(`${value / 1_000_000} SECOND`), param)}`;
    });
    relationalQueryTranslator.registerMember(Temporal.Instant.prototype, "epochMilliseconds", (qb, exp, param) => `CAST((${qb.toString(exp.objectOperand, param)} - TIMESTAMP '1970-01-01 00:00:00 UTC') DAY TO SECOND AS DECIMAL(20,3)) * 1000`);
    relationalQueryTranslator.registerMember(Temporal.Instant.prototype, "epochNanoseconds", (qb, exp, param) => `CAST((${qb.toString(exp.objectOperand, param)} - TIMESTAMP '1970-01-01 00:00:00 UTC') DAY TO SECOND AS DECIMAL(20,3)) * 1000000000`);

    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "toString", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "toJSON", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "toZonedDateTimeISO", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)} AT TIME ZONE ${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "add", (qb, exp, param) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Omit<Temporal.DurationLike, 'years' | 'months' | 'weeks' | 'days'>>;
        const intervalParams = [] as string[];
        if (paramExp.object.hours) {
            intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
        }
        if (paramExp.object.minutes) {
            intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
        }
        let secondParts = [] as string[];
        if (paramExp.object.seconds) {
            secondParts.push(qb.toString(paramExp.object.seconds, param));
        }
        if (paramExp.object.milliseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
        }
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, param)}) + make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "subtract", (qb, exp, param) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Omit<Temporal.DurationLike, 'years' | 'months' | 'weeks' | 'days'>>;
        const intervalParams = [] as string[];
        if (paramExp.object.hours) {
            intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
        }
        if (paramExp.object.minutes) {
            intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
        }
        let secondParts = [] as string[];
        if (paramExp.object.seconds) {
            secondParts.push(qb.toString(paramExp.object.seconds, param));
        }
        if (paramExp.object.milliseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
        }
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, param)}) - make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)})=${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "round", (qb, exp, param) => {
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
        return `DATE_TRUNC(${qb.toString(smallestUnitParam, param)}, ${qb.toString(exp.objectOperand, param)})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Instant.prototype, "valueOf", (qb, exp, param) => {
        throw new Error(`Temporal.Instant.valueOf: not supported`);
    });


    /**
     * Temporal.PlainDate
     * TODO: since, until, calendarId, dayOfWeek, dayOfYear, daysInMonth, daysInWeek, daysInYear, era, eraYear, inleapYear
     * monthinyear, weekofyear, yearofweek, withCalendar()
     */
    relationalQueryTranslator.registerMethod(Temporal.PlainDate, "from", (qb, exp, param) => `DATE ${qb.toString(exp.params[0], param)}`);

    relationalQueryTranslator.registerMember(Temporal.PlainDate.prototype, "year", (qb, exp, param) => `EXTRACT(YEAR FROM ${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainDate.prototype, "month", (qb, exp, param) => `EXTRACT(MONTH FROM ${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainDate.prototype, "day", (qb, exp, param) => `EXTRACT(DAY FROM ${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainDate.prototype, "monthCode", (qb, exp, param) => `${qb.valueString("M")}`);

    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "toString", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "toJSON", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`);
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "add", (qb, exp, param) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
        const intervalParams = [] as string[];
        if (paramExp.object.years) {
            intervalParams.push(`years => ${qb.toString(paramExp.object.years, param)}`);
        }
        if (paramExp.object.months) {
            intervalParams.push(`months => ${qb.toString(paramExp.object.months, param)}`);
        }
        if (paramExp.object.weeks) {
            intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, param)}`);
        }
        if (paramExp.object.days) {
            intervalParams.push(`days => ${qb.toString(paramExp.object.days, param)}`);
        }
        if (paramExp.object.hours) {
            intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
        }
        if (paramExp.object.minutes) {
            intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
        }
        let secondParts = [] as string[];
        if (paramExp.object.seconds) {
            secondParts.push(qb.toString(paramExp.object.seconds, param));
        }
        if (paramExp.object.milliseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
        }
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, param)}) + make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "subtract", (qb, exp, param) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
        const intervalParams = [] as string[];
        if (paramExp.object.years) {
            intervalParams.push(`years => ${qb.toString(paramExp.object.years, param)}`);
        }
        if (paramExp.object.months) {
            intervalParams.push(`months => ${qb.toString(paramExp.object.months, param)}`);
        }
        if (paramExp.object.weeks) {
            intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, param)}`);
        }
        if (paramExp.object.days) {
            intervalParams.push(`days => ${qb.toString(paramExp.object.days, param)}`);
        }
        if (paramExp.object.hours) {
            intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
        }
        if (paramExp.object.minutes) {
            intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
        }
        let secondParts = [] as string[];
        if (paramExp.object.seconds) {
            secondParts.push(qb.toString(paramExp.object.seconds, param));
        }
        if (paramExp.object.milliseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
        }
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, param)}) - make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)})=${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "with", (qb, exp, param) => {
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
        const objectQ = qb.toString(exp.objectOperand, param);
        let yearQ = `EXTRACT(YEAR FROM ${objectQ})`;
        if (paramInfoExp.object.year) {
            yearQ = `COALESCE(${qb.toString(paramInfoExp.object.year, param)}, ${yearQ})`;
        }
        let monthQ = `EXTRACT(MONTH FROM ${objectQ})`;
        if (paramInfoExp.object.month) {
            monthQ = `COALESCE(${qb.toString(paramInfoExp.object.month, param)}, ${monthQ})`;
        }
        let dayQ = `EXTRACT(DAY FROM ${objectQ})`;
        if (paramInfoExp.object.day) {
            dayQ = `COALESCE(${qb.toString(paramInfoExp.object.day, param)}, ${dayQ})`;
        }

        return `MAKE_DATE(CAST(${yearQ} as int), CAST(${monthQ} as int), CAST(${dayQ} as int))`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "valueOf", (qb, exp, param) => {
        throw new Error(`Temporal.PlainDate.valueOf: not supported`);
    });


    /**
     * Temporal.PlainTime
     * TODO: since, until
     */
    relationalQueryTranslator.registerMethod(Temporal.PlainTime, "from", (qb, exp, param) => `TIME ${qb.toString(exp.params[0], param)}`);

    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "hour", (qb, exp, param) => `EXTRACT(HOUR FROM ${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "minute", (qb, exp, param) => `EXTRACT(MINUTE FROM ${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "second", (qb, exp, param) => `EXTRACT(SECOND FROM ${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "millisecond", (qb, exp, param) => `FLOOR(EXTRACT(MILLISECOND FROM ${qb.toString(exp.objectOperand, param)}))`);
    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "microsecond", (qb, exp, param) => `FLOOR(EXTRACT(MICROSECOND FROM ${qb.toString(exp.objectOperand, param)}))`);
    relationalQueryTranslator.registerMember(Temporal.PlainTime.prototype, "nanosecond", (qb, exp, param) => `FLOOR(EXTRACT(MICROSECOND FROM ${qb.toString(exp.objectOperand, param)})* 1000)`);

    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "toString", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'HH24:MI:SS.US')`);
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "toJSON", (qb, exp, param) => `TO_CHAR(${qb.toString(exp.objectOperand, param)}, 'HH24:MI:SS.US')`);
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "add", (qb, exp, param) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
        const intervalParams = [] as string[];
        if (paramExp.object.years) {
            intervalParams.push(`years => ${qb.toString(paramExp.object.years, param)}`);
        }
        if (paramExp.object.months) {
            intervalParams.push(`months => ${qb.toString(paramExp.object.months, param)}`);
        }
        if (paramExp.object.weeks) {
            intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, param)}`);
        }
        if (paramExp.object.days) {
            intervalParams.push(`days => ${qb.toString(paramExp.object.days, param)}`);
        }
        if (paramExp.object.hours) {
            intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
        }
        if (paramExp.object.minutes) {
            intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
        }
        let secondParts = [] as string[];
        if (paramExp.object.seconds) {
            secondParts.push(qb.toString(paramExp.object.seconds, param));
        }
        if (paramExp.object.milliseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
        }
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, param)}) + make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "subtract", (qb, exp, param) => {
        const paramExp = exp.params[0] as ObjectValueExpression<Temporal.DurationLike>;
        const intervalParams = [] as string[];
        if (paramExp.object.years) {
            intervalParams.push(`years => ${qb.toString(paramExp.object.years, param)}`);
        }
        if (paramExp.object.months) {
            intervalParams.push(`months => ${qb.toString(paramExp.object.months, param)}`);
        }
        if (paramExp.object.weeks) {
            intervalParams.push(`weeks => ${qb.toString(paramExp.object.weeks, param)}`);
        }
        if (paramExp.object.days) {
            intervalParams.push(`days => ${qb.toString(paramExp.object.days, param)}`);
        }
        if (paramExp.object.hours) {
            intervalParams.push(`hours => ${qb.toString(paramExp.object.hours, param)}`);
        }
        if (paramExp.object.minutes) {
            intervalParams.push(`mins => ${qb.toString(paramExp.object.minutes, param)}`);
        }
        let secondParts = [] as string[];
        if (paramExp.object.seconds) {
            secondParts.push(qb.toString(paramExp.object.seconds, param));
        }
        if (paramExp.object.milliseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.milliseconds, param)} / 1000)`);
        }
        if (paramExp.object.nanoseconds) {
            secondParts.push(`(${qb.toString(paramExp.object.nanoseconds, param)} / 1000000000)`);
        }
        if (secondParts.length) {
            intervalParams.push(`secs => ${secondParts.join("+")}`);
        }
        return `${qb.toString(exp.objectOperand, param)}) - make_interval(${intervalParams.join(",")})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)})=${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "with", (qb, exp, param) => {
        if (exp.params.length !== 1) {
            throw Error("Temporal.PlainDate.with: only support info");
        }
        const paramInfoExp = exp.params[0] as ObjectValueExpression<Temporal.PlainTimeLike>;
        const objectQ = qb.toString(exp.objectOperand, param);
        let hourQ = `EXTRACT(HOUR FROM ${objectQ})`;
        if (paramInfoExp.object.hour) {
            hourQ = `COALESCE(${qb.toString(paramInfoExp.object.hour, param)}, ${hourQ})`;
        }
        let minuteQ = `EXTRACT(MINUTE FROM ${objectQ})`;
        if (paramInfoExp.object.minute) {
            minuteQ = `COALESCE(${qb.toString(paramInfoExp.object.minute, param)}, ${minuteQ})`;
        }
        let secondQ = `EXTRACT(SECOND FROM ${objectQ})`;
        const secondParts = [] as string[];
        if (paramInfoExp.object.second) {
            secondParts.push(qb.toString(paramInfoExp.object.second, param));
        }
        if (paramInfoExp.object.millisecond) {
            secondParts.push(`${qb.toString(paramInfoExp.object.second, param)}/1000.0`);
        }
        if (paramInfoExp.object.microsecond) {
            secondParts.push(`${qb.toString(paramInfoExp.object.second, param)}/1000000.0`);
        }
        if (paramInfoExp.object.nanosecond) {
            secondParts.push(`${qb.toString(paramInfoExp.object.second, param)}/1000000000.0`);
        }
        if (secondParts.length) {
            secondQ = `COALESCE(${secondParts.join("+")}, ${secondQ})`;
        }

        return `MAKE_TIME(CAST(${hourQ} as int), CAST(${minuteQ} as int), ${secondQ})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainTime.prototype, "round", (qb, exp, param) => {
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
        return `DATE_TRUNC(${qb.toString(smallestUnitParam, param)}, ${qb.toString(exp.objectOperand, param)})`;
    });
    relationalQueryTranslator.registerMethod(Temporal.PlainDate.prototype, "valueOf", (qb, exp, param) => {
        throw new Error(`Temporal.PlainDate.valueOf: not supported`);
    });


    /**
     * Temporal.Now
     * TODO: timeZoneId()
     */
    relationalQueryTranslator.registerMethod(Temporal.Now, "instant", (qb, exp, param) => `CURRENT_TIMESTAMP`);
    relationalQueryTranslator.registerMethod(Temporal.Now, "plainDateISO", (qb, exp, param) => {
        if (!exp.params.length) {
            return `CURRENT_DATE`;
        }

        return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)} as DATE)`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Now, "plainDateTimeISO", (qb, exp, param) => {
        if (!exp.params.length) {
            return `CAST(CURRENT_TIMESTAMP as TIMESTAMP)`;
        }

        return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)} as TIMESTAMP)`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Now, "plainTimeISO", (qb, exp, param) => {
        if (!exp.params.length) {
            return `CURRENT_TIME`;
        }

        return `CAST(CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)} as TIME)`;
    });
    relationalQueryTranslator.registerMethod(Temporal.Now, "zonedDateTimeISO", (qb, exp, param) => {
        if (!exp.params.length) {
            return `CURRENT_TIMESTAMP`;
        }

        return `CURRENT_TIMESTAMP AT TIME ZONE ${qb.toString(exp.params[0], param)}`;
    });
}

if (Decimal) {
    /**
     * Decimal
     * TODO: toSD, toSignificantDigits, static methods
     */
    relationalQueryTranslator.registerConstructor(Decimal, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} as NUMERIC)`, o => o.params.length === 1);
    relationalQueryTranslator.registerFn(Decimal, (qb, exp, param) => `CAST(${qb.toString(exp.params[0], param)} as NUMERIC)`, o => o.params.length === 1);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "plus", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}+${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "add", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}+${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "minus", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}-${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "sub", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}-${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "times", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}*${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "mul", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}*${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "div", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}/${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "dividedBy", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}/${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "pow", (qb, exp, param) => `POWER(${qb.toString(exp.objectOperand, param)},${qb.toString(exp.params[0], param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "toPower", (qb, exp, param) => `POWER(${qb.toString(exp.objectOperand, param)},${qb.toString(exp.params[0], param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "neg", (qb, exp, param) => `-${qb.toString(exp.objectOperand, param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "negated", (qb, exp, param) => `-${qb.toString(exp.objectOperand, param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "abs", (qb, exp, param) => `ABS(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "absoluteValue", (qb, exp, param) => `ABS(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "mod", (qb, exp, param) => `MOD(${qb.toString(exp.objectOperand, param)},${qb.toString(exp.params[0], param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "modulo", (qb, exp, param) => `MOD(${qb.toString(exp.objectOperand, param)},${qb.toString(exp.params[0], param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "sqrt", (qb, exp, param) => `SQRT(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "squareRoot", (qb, exp, param) => `SQRT(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cbrt", (qb, exp, param) => `CBRT(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cubeRoot", (qb, exp, param) => `CBRT(${qb.toString(exp.objectOperand, param)})`);

    relationalQueryTranslator.registerMethod(Decimal.prototype, "eq", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}=${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "equals", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}=${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "lt", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "lessThan", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "lte", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<=${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "lessThanOrEqualTo", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<=${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "gt", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "greaterThan", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "gte", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>=${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "greaterThanOrEqualTo", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>=${qb.toString(exp.params[0], param)}`);

    relationalQueryTranslator.registerMethod(Decimal.prototype, "round", (qb, exp, param) => `ROUND(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "floor", (qb, exp, param) => `FLOOR(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "ceil", (qb, exp, param) => `CEILING(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "trunc", (qb, exp, param) => `TRUNC(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "truncated", (qb, exp, param) => `TRUNC(${qb.toString(exp.objectOperand, param)})`);

    relationalQueryTranslator.registerMethod(Decimal.prototype, "sin", (qb, exp, param) => `SIN(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "sine", (qb, exp, param) => `SIN(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cos", (qb, exp, param) => `COS(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cosine", (qb, exp, param) => `COS(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "tan", (qb, exp, param) => `TAN(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "tangent", (qb, exp, param) => `TAN(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "asin", (qb, exp, param) => `ASIN(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseSine", (qb, exp, param) => `ASIN(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "acos", (qb, exp, param) => `ACOS(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseCosine", (qb, exp, param) => `ACOS(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "atan", (qb, exp, param) => `ATAN(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseTangent", (qb, exp, param) => `ATAN(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "sinh", (qb, exp, param) => `SINH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "hyperbolicSine", (qb, exp, param) => `SINH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cosh", (qb, exp, param) => `COSH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "hyperbolicCosine", (qb, exp, param) => `COSH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "tanh", (qb, exp, param) => `TANH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "hyperbolicTangent", (qb, exp, param) => `TANH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "asinh", (qb, exp, param) => `ASINH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseHyperbolicSine", (qb, exp, param) => `ASINH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "acosh", (qb, exp, param) => `ACOSH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseHyperbolicCosine", (qb, exp, param) => `ACOSH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "atanh", (qb, exp, param) => `ATANH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "inverseHyperbolicTangent", (qb, exp, param) => `ATANH(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "exp", (qb, exp, param) => `EXP(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "naturalExponential", (qb, exp, param) => `EXP(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "ln", (qb, exp, param) => `LN(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "naturalLogarithm", (qb, exp, param) => `LN(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "log", (qb, exp, param) => `LOG(${qb.toString(exp.objectOperand, param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "logarithm", (qb, exp, param) => `LOG(${qb.toString(exp.objectOperand, param)})`);

    relationalQueryTranslator.registerMethod(Decimal.prototype, "clamp", (qb, exp, param) => `LEAST(GREATEST(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)}), ${qb.toString(exp.params[1], param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "clampedTo", (qb, exp, param) => `LEAST(GREATEST(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)}), ${qb.toString(exp.params[1], param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "divToInt", (qb, exp, param) => `FLOOR(${qb.toString(exp.objectOperand, param)}/${qb.toString(exp.params[0], param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "dividedToIntegerBy", (qb, exp, param) => `FLOOR(${qb.toString(exp.objectOperand, param)}/${qb.toString(exp.params[0], param)})`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "toDP", (qb, exp, param) => `ROUND(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)})`, o => o.params.length === 1);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "toDecimalPlaces", (qb, exp, param) => `ROUND(${qb.toString(exp.objectOperand, param)}, ${qb.toString(exp.params[0], param)})`, o => o.params.length === 1);

    relationalQueryTranslator.registerMethod(Decimal.prototype, "toNumber", (qb, exp, param) => `CAST(${qb.toString(exp.objectOperand, param)} as DOUBLE PRECISION)`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "toNearest", (qb, exp, param) => `ROUND(${qb.toString(exp.objectOperand, param)}/${qb.toString(exp.params[0], param)})*${qb.toString(exp.params[0], param)}`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "toPrecision", (qb, exp, param) => {
        const ob = qb.toString(exp.objectOperand, param);
        const paramQ = exp.params.length ? qb.toString(exp.params[0], param) : "0";
        return `CASE WHEN ${ob}=0 THEN 0
ELSE ROUND(${ob}, ${paramQ} - FLOOR(LOG(10, ABS(${ob}))) - 1)
END`;
    });
    relationalQueryTranslator.registerMethod(Decimal.prototype, "cmp", (qb, exp, param) => {
        const obQ = qb.toString(exp.objectOperand, param);
        const paramQ = qb.toString(exp.params[0], param);
        return `CASE WHEN ${obQ}<${paramQ} THEN -1 WHEN ${obQ}>${paramQ} THEN 1 ELSE 0 END`;
    }, o => o.params.length === 1);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "comparedTo", (qb, exp, param) => {
        const obQ = qb.toString(exp.objectOperand, param);
        const paramQ = qb.toString(exp.params[0], param);
        return `CASE WHEN ${obQ}<${paramQ} THEN -1 WHEN ${obQ}>${paramQ} THEN 1 ELSE 0 END`;
    }, o => o.params.length === 1);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "decimalPlaces", (qb, exp, param) => {
        const obQ = qb.toString(exp.objectOperand, param);
        return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE CHAR_LENGTH(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
    });
    relationalQueryTranslator.registerMethod(Decimal.prototype, "dp", (qb, exp, param) => {
        const obQ = qb.toString(exp.objectOperand, param);
        return `CASE WHEN ${obQ}=TRUNC(${obQ}) THEN 0 ELSE CHAR_LENGTH(SUBSTRING(CAST(${obQ} as VARCHAR) FROM POSITION('.' IN CAST(${obQ} AS VARCHAR)) + 1)) END`;
    });
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isInt", (qb, exp, param) => {
        const obQ = qb.toString(exp.objectOperand, param);
        return `${obQ}=TRUNC(${obQ})`;
    });
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isInteger", (qb, exp, param) => {
        const obQ = qb.toString(exp.objectOperand, param);
        return `${obQ}=TRUNC(${obQ})`;
    });
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isNeg", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<0`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isNegative", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}<0`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isPos", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>0`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isPositive", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}>0`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isZero", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)}=0`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isFinite", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)} ~ '^-?[0-9]+(\.[0-9]+)?$'`);
    relationalQueryTranslator.registerMethod(Decimal.prototype, "isNaN", (qb, exp, param) => `${qb.toString(exp.objectOperand, param)} !~ '^-?[0-9]+(\.[0-9]+)?$'`);

    relationalQueryTranslator.registerMethod(Decimal, "random", (qb, exp, param) => {
        if (!exp.params.length) {
            return `RANDOM()`;
        }
        const paramQ = qb.toString(exp.params[0], param);
        return `FLOOR(RANDOM()* 10^${paramQ})/10^${paramQ}`;
    });
}