import { QueryTranslator } from "./QueryTranslator";
import { QueryBuilder } from "../QueryBuilder";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { AssignmentExpression } from "../../ExpressionBuilder/Expression/AssignmentExpression";
import { AdditionAssignmentExpression } from "../../ExpressionBuilder/Expression/AdditionAssignmentExpression";
import { SubstractionAssignmentExpression } from "../../ExpressionBuilder/Expression/SubstractionAssignmentExpression";
import { MultiplicationAssignmentExpression } from "../../ExpressionBuilder/Expression/MultiplicationAssignmentExpression";
import { DivisionAssignmentExpression } from "../../ExpressionBuilder/Expression/DivisionAssignmentExpression";
import { ExponentiationAssignmentExpression } from "../../ExpressionBuilder/Expression/ExponentiationAssignmentExpression";
import { ModulusAssignmentExpression } from "../../ExpressionBuilder/Expression/ModulusAssignmentExpression";
import { BitwiseAndAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseAndAssignmentExpression";
import { BitwiseXorAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseXorAssignmentExpression";
import { BitwiseOrAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseOrAssignmentExpression";
import { BitwiseZeroLeftShiftAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseZeroLeftShiftAssignmentExpression";
import { BitwiseZeroRightShiftAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseZeroRightShiftAssignmentExpression";
import { BitwiseSignedRightShiftAssignmentExpression } from "../../ExpressionBuilder/Expression/BitwiseSignedRightShiftAssignmentExpression";
import { LeftIncrementExpression } from "../../ExpressionBuilder/Expression/LeftIncrementExpression";
import { LeftDecrementExpression } from "../../ExpressionBuilder/Expression/LeftDecrementExpression";
import { RightIncrementExpression } from "../../ExpressionBuilder/Expression/RightIncrementExpression";
import { RightDecrementExpression } from "../../ExpressionBuilder/Expression/RightDecrementExpression";
import { GreaterEqualExpression } from "../../ExpressionBuilder/Expression/GreaterEqualExpression";
import { GreaterThanExpression } from "../../ExpressionBuilder/Expression/GreaterThanExpression";
import { LessEqualExpression } from "../../ExpressionBuilder/Expression/LessEqualExpression";
import { LessThanExpression } from "../../ExpressionBuilder/Expression/LessThanExpression";
import { NotEqualExpression } from "../../ExpressionBuilder/Expression/NotEqualExpression";
import { OrExpression } from "../../ExpressionBuilder/Expression/OrExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "../../ExpressionBuilder/Expression/StrictNotEqualExpression";
import { SubtractionExpression } from "../../ExpressionBuilder/Expression/SubtractionExpression";
import { MultiplicationExpression } from "../../ExpressionBuilder/Expression/MultiplicationExpression";
import { BitwiseNotExpression } from "../../ExpressionBuilder/Expression/BitwiseNotExpression";
import { NotExpression } from "../../ExpressionBuilder/Expression/NotExpression";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { BitwiseAndExpression } from "../../ExpressionBuilder/Expression/BitwiseAndExpression";
import { BitwiseOrExpression } from "../../ExpressionBuilder/Expression/BitwiseOrExpression";
import { BitwiseXorExpression } from "../../ExpressionBuilder/Expression/BitwiseXorExpression";
import { DivisionExpression } from "../../ExpressionBuilder/Expression/DivisionExpression";
import { ModulusExpression } from "../../ExpressionBuilder/Expression/ModulusExpression";
import { IUnaryOperatorExpression } from "../../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { Enumerable } from "../../Enumerable/Enumerable";

export const relationalQueryTranslator = new QueryTranslator(Symbol("relational"));

//#region Function

relationalQueryTranslator.register(parseInt, (exp: any, qb: QueryBuilder) => `CAST(${qb.getExpressionString(exp.params[0])} AS INT)`);
relationalQueryTranslator.register(parseFloat, (exp: any, qb: QueryBuilder) => `CAST(${qb.getExpressionString(exp.params[0])} AS FLOAT)`);
relationalQueryTranslator.register(isNaN, (exp: any, qb: QueryBuilder) => `ISNUMERIC(${qb.getExpressionString(exp.params[0])}) = 0`);

//#endregion

//#region Member Access

/**
 * Math
 */
relationalQueryTranslator.register(Math, "E", () => "EXP(1)", true);
relationalQueryTranslator.register(Math, "LN10", () => "LOG(10)", true);
relationalQueryTranslator.register(Math, "LN2", () => "LOG(2)", true);
relationalQueryTranslator.register(Math, "LOG10E", () => "LOG10(EXP(1))", true);
relationalQueryTranslator.register(Math, "LOG2E", () => "LOG(EXP(1), 2)", true);
relationalQueryTranslator.register(Math, "PI", () => "PI()", true);
relationalQueryTranslator.register(Math, "SQRT1_2", () => "SQRT(0.5)", true);
relationalQueryTranslator.register(Math, "SQRT2", () => "SQRT(2)", true);

/**
 * String
 */
relationalQueryTranslator.register(String.prototype, "length", (exp: MemberAccessExpression<any, any>, qb: QueryBuilder) => `LEN(${qb.getExpressionString(exp.objectOperand)})`);

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
 * SelectExpression
 */
relationalQueryTranslator.register(SelectExpression.prototype, "all", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `NOT EXIST(${qb.newLine(1) + qb.getExpressionString(exp.objectOperand) + qb.newLine(-1)})`);
relationalQueryTranslator.register(SelectExpression.prototype, "any", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `EXIST(${qb.newLine(1) + qb.getExpressionString(exp.objectOperand) + qb.newLine(-1)})`);
relationalQueryTranslator.register(SelectExpression.prototype, "count", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `COUNT(${qb.getExpressionString(exp.params[0])})`);
const aggregateTranslator = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `${exp.methodName.toUpperCase()}(${qb.getExpressionString(exp.params[0])})`;
relationalQueryTranslator.register(SelectExpression.prototype, "sum", aggregateTranslator);
relationalQueryTranslator.register(SelectExpression.prototype, "min", aggregateTranslator);
relationalQueryTranslator.register(SelectExpression.prototype, "max", aggregateTranslator);
relationalQueryTranslator.register(SelectExpression.prototype, "avg", aggregateTranslator);
relationalQueryTranslator.register(SelectExpression.prototype, "contains", (exp: MethodCallExpression<Array<any>, any>, qb: QueryBuilder) => `${qb.getExpressionString(exp.params[0])} IN ${qb.getExpressionString(exp.objectOperand)}`);


/**
 * Array
 * TODO: contains,concat,copyWithin,every,fill,filter,find,findIndex,forEach,indexOf,join,lastIndexOf,map,pop,push,reduce,reduceRight,reverse,shift,slice,some,sort,splice,toString,unshift,valueOf
 */
relationalQueryTranslator.register(Array.prototype, "contains", (exp: MethodCallExpression<Array<any>, any>, qb: QueryBuilder) => `${qb.getExpressionString(exp.params[0])} IN (${qb.getExpressionString(exp.objectOperand)})`);

/**
 * Enumerable
 * TODO: contains,concat,copyWithin,every,fill,filter,find,findIndex,forEach,indexOf,join,lastIndexOf,map,pop,push,reduce,reduceRight,reverse,shift,slice,some,sort,splice,toString,unshift,valueOf
 */
relationalQueryTranslator.register(Enumerable.prototype, "contains", (exp: MethodCallExpression<Array<any>, any>, qb: QueryBuilder) => `${qb.getExpressionString(exp.params[0])} IN (${qb.getExpressionString(exp.objectOperand)})`);


/**
 * Math
 * TODO: max,min,acosh,asinh,atanh,cbrt,clz32,fround,imul
 */
const trigonoTranslator = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `${exp.methodName.toUpperCase()}(${qb.getExpressionString(exp.params[0])})`;
relationalQueryTranslator.register(Math, "abs", trigonoTranslator);
relationalQueryTranslator.register(Math, "acos", trigonoTranslator);
relationalQueryTranslator.register(Math, "asin", trigonoTranslator);
relationalQueryTranslator.register(Math, "atan", trigonoTranslator);
relationalQueryTranslator.register(Math, "cos", trigonoTranslator);
relationalQueryTranslator.register(Math, "exp", trigonoTranslator);
relationalQueryTranslator.register(Math, "sin", trigonoTranslator);
relationalQueryTranslator.register(Math, "sqrt", trigonoTranslator);
relationalQueryTranslator.register(Math, "tan", trigonoTranslator);
relationalQueryTranslator.register(Math, "floor", trigonoTranslator);
relationalQueryTranslator.register(Math, "log", trigonoTranslator);
relationalQueryTranslator.register(Math, "log10", trigonoTranslator);
relationalQueryTranslator.register(Math, "sign", trigonoTranslator);
relationalQueryTranslator.register(Math, "ceil", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `CEILING(${qb.getExpressionString(exp.params[0])})`);
relationalQueryTranslator.register(Math, "atan2", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `ATN2(${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.params[1])})`);
relationalQueryTranslator.register(Math, "pow", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `POWER(${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.params[1])})`);
relationalQueryTranslator.register(Math, "random", () => "RAND()", true);
relationalQueryTranslator.register(Math, "round", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `ROUND(${qb.getExpressionString(exp.params[0])}, 0)`);
relationalQueryTranslator.register(Math, "expm1", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(EXP(${qb.getExpressionString(exp.params[0])}) - 1)`);
relationalQueryTranslator.register(Math, "hypot", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `SQRT(${exp.params.select((p) => `POWER(${qb.getExpressionString(p)}, 2)`).toArray().join(" + ")})`);
relationalQueryTranslator.register(Math, "log1p", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `LOG(1 + ${qb.getExpressionString(exp.params[0])})`);
relationalQueryTranslator.register(Math, "log2", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `LOG(${qb.getExpressionString(exp.params[0])}, 2)`);
relationalQueryTranslator.register(Math, "sinh", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `((EXP(${qb.getExpressionString(exp.params[0])}) - EXP(-${qb.getExpressionString(exp.params[0])})) / 2)`);
relationalQueryTranslator.register(Math, "cosh", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `((EXP(${qb.getExpressionString(exp.params[0])}) + EXP(-${qb.getExpressionString(exp.params[0])})) / 2)`);
relationalQueryTranslator.register(Math, "tanh", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `((EXP(2 * ${qb.getExpressionString(exp.params[0])}) - 1) / (EXP(2 * ${qb.getExpressionString(exp.params[0])}) + 1))`);
relationalQueryTranslator.register(Math, "trunc", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(${qb.getExpressionString(exp.params[0])} | 0)`);

/**
 * String
 * TODO: localeCompare,match,normalize,padEnd,padStart,search,slice
 */
relationalQueryTranslator.register(String.prototype, "charAt", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `SUBSTRING(${qb.getExpressionString(exp.objectOperand)}, ${qb.getExpressionString(exp.params[0])} + 1, 1)`);
relationalQueryTranslator.register(String.prototype, "charCodeAt", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `UNICODE(SUBSTRING(${qb.getExpressionString(exp.objectOperand)}, ${qb.getExpressionString(exp.params[0])} + 1, 1))`);
relationalQueryTranslator.register(String.prototype, "concat", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `CONCAT(${qb.getExpressionString(exp.objectOperand)}, ${exp.params.select((p) => qb.getExpressionString(p)).toArray().join(", ")})`);
relationalQueryTranslator.register(String.prototype, "endsWith", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(${qb.getExpressionString(exp.objectOperand)} LIKE CONCAT(${qb.getValueString("%")}, ${qb.getExpressionString(exp.params[0])}))`);
relationalQueryTranslator.register(String.prototype, "includes", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) =>
    exp.params.length > 1
    ? `(${qb.getExpressionString(exp.params[0])} + RIGHT(${qb.getExpressionString(exp.objectOperand)}, (LEN(${qb.getExpressionString(exp.objectOperand)}) - ${qb.getExpressionString(exp.params[0])}))))`
    : `(${qb.getExpressionString(exp.objectOperand)} LIKE CONCAT(${qb.getValueString("%")}, ${qb.getExpressionString(exp.params[0])}, ${qb.getValueString("%")})`);
relationalQueryTranslator.register(String.prototype, "indexOf", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(CHARINDEX(${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.objectOperand) + (exp.params.length > 1 ? `, ${qb.getExpressionString(exp.params[1])}` : "")}) - 1)`);
relationalQueryTranslator.register(String.prototype, "lastIndexOf", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(LEN(${qb.getExpressionString(exp.objectOperand)}) - CHARINDEX(${qb.getExpressionString(exp.params[0])}, REVERSE(${qb.getExpressionString(exp.objectOperand)})${(exp.params.length > 1 ? `, ${qb.getExpressionString(exp.params[1])}` : "")}))`);
relationalQueryTranslator.register(String.prototype, "like", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(${qb.getExpressionString(exp.objectOperand)} LIKE ${qb.getExpressionString(exp.params[0])})`);
relationalQueryTranslator.register(String.prototype, "repeat", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `REPLICATE(${qb.getExpressionString(exp.objectOperand)}, ${qb.getExpressionString(exp.params[0])})`);
relationalQueryTranslator.register(String.prototype, "replace", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `REPLACE(${qb.getExpressionString(exp.objectOperand)}, ${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.params[1])})`);
relationalQueryTranslator.register(String.prototype, "split", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `STRING_SPLIT(${qb.getExpressionString(exp.objectOperand)}, ${qb.getExpressionString(exp.params[0])})`);
relationalQueryTranslator.register(String.prototype, "startsWith", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(${qb.getExpressionString(exp.objectOperand)} LIKE CONCAT(${qb.getExpressionString(exp.params[0])}, ${qb.getValueString("%")}))`);
relationalQueryTranslator.register(String.prototype, "substr", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `SUBSTRING(${qb.getExpressionString(exp.objectOperand)}, (${qb.getExpressionString(exp.params[0])} + 1), ${(exp.params.length > 1 ? qb.getExpressionString(exp.params[1]) : "8000")})`);
relationalQueryTranslator.register(String.prototype, "substring", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `SUBSTRING(${qb.getExpressionString(exp.objectOperand)}, (${qb.getExpressionString(exp.params[0])} + 1), ${(exp.params.length > 1 ? `(${qb.getExpressionString(exp.params[1])} - ${qb.getExpressionString(exp.params[0])})` : "8000")})`);
const tolowerTranslator = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `LOWER(${qb.getExpressionString(exp.objectOperand)})`;
relationalQueryTranslator.register(String.prototype, "toLowerCase", tolowerTranslator);
relationalQueryTranslator.register(String.prototype, "toLocaleLowerCase", tolowerTranslator);
const toupperTranslator = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `UPPER(${qb.getExpressionString(exp.objectOperand)})`;
relationalQueryTranslator.register(String.prototype, "toUpperCase", toupperTranslator);
relationalQueryTranslator.register(String.prototype, "toLocaleUpperCase", toupperTranslator);
const stringValueOf = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => qb.getExpressionString(exp.objectOperand);
relationalQueryTranslator.register(String.prototype, "toString", stringValueOf);
relationalQueryTranslator.register(String.prototype, "valueOf", stringValueOf);
relationalQueryTranslator.register(String.prototype, "trim", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `RTRIM(LTRIM(${qb.getExpressionString(exp.objectOperand)}))`);

/**
 * Number
 * TODO: isFinite,isInteger,isNaN,isSafeInteger,toExponential,toFixed,toPrecision
 */
relationalQueryTranslator.register(Number.prototype, "toString", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `CAST(${qb.getExpressionString(exp.objectOperand)} AS nvarchar(255))`);
relationalQueryTranslator.register(Number.prototype, "valueOf", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => qb.getExpressionString(exp.objectOperand));

/**
 * Symbol
 * TODO: toString
 */

/**
 * Boolean
 * TODO: 
 */
relationalQueryTranslator.register(Boolean.prototype, "toString" as any, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(CASE WHEN (${qb.getExpressionString(exp.objectOperand)}) THEN ${qb.getValueString("true")} ELSE ${qb.getValueString("false")} END)`);

/**
 * Date
 * TODO: getTime,getTimezoneOffset,getUTCDate,getUTCDay,getUTCFullYear,getUTCHours,getUTCMilliseconds,getUTCMinutes,getUTCMonth,getUTCSeconds,getYear,setTime,setUTCDate,setUTCFullYear,setUTCHours,setUTCMilliseconds,setUTCMinutes,setUTCMonth,setUTCSeconds,toJSON,toISOString,toLocaleDateString,toLocaleTimeString,toLocaleString,toString,valueOf,toTimeString,toUTCString,toGMTString 
 */
relationalQueryTranslator.register(Date, "currentTimestamp", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `CURRENT_TIMESTAMP`);
relationalQueryTranslator.register(Date.prototype, "getDate", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DAY(${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "getDay", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(DATEPART(weekday, ${qb.getExpressionString(exp.objectOperand)}) - 1)`);
relationalQueryTranslator.register(Date.prototype, "getFullYear", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `YEAR(${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "getHours", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEPART(hour, ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "getMinutes", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEPART(minute, ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "getMonth", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `(MONTH(${qb.getExpressionString(exp.objectOperand)}) - 1)`);
relationalQueryTranslator.register(Date.prototype, "getSeconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEPART(second, ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "getMilliseconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEPART(millisecond, ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "setDate", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(DAY, (${qb.getExpressionString(exp.params[0])} - DAY(${qb.getExpressionString(exp.objectOperand)})), ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "setFullYear", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(YYYY, (${qb.getExpressionString(exp.params[0])} - YEAR(${qb.getExpressionString(exp.objectOperand)})), ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "setHours", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(HH, (${qb.getExpressionString(exp.params[0])} - DATEPART(hour, ${qb.getExpressionString(exp.objectOperand)})), ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "setMilliseconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(MS, (${qb.getExpressionString(exp.params[0])} - DATEPART(millisecond, ${qb.getExpressionString(exp.objectOperand)})), ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "setMinutes", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(MI, (${qb.getExpressionString(exp.params[0])} - DATEPART(minute, ${qb.getExpressionString(exp.objectOperand)})), ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "setMonth", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(MM, (${qb.getExpressionString(exp.params[0])} - (MONTH(${qb.getExpressionString(exp.objectOperand)}) - 1)), ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "setSeconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(SS, (${qb.getExpressionString(exp.params[0])} - DATEPART(second, ${qb.getExpressionString(exp.objectOperand)})), ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "toDateString", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `CONCAT(LEFT(DATENAME(WEEKDAY, ${qb.getExpressionString(exp.objectOperand)}), 3), ${qb.getValueString(" ")}, LEFT(DATENAME(MONTH, ${qb.getExpressionString(exp.objectOperand)}), 3), ${qb.getValueString(" ")}, RIGHT(CONCAT(${qb.getValueString("0")}, RTRIM(MONTH(${qb.getExpressionString(exp.objectOperand)}))), 2), ${qb.getValueString(" ")}, RIGHT(CONCAT(${qb.getValueString("0")}, RTRIM(MONTH(${qb.getExpressionString(exp.objectOperand)}))), 2))`);
relationalQueryTranslator.register(Date.prototype, "addDays", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(DAY, ${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "addMonths", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(MM, ${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "addYears", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(YYYY, ${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "addHours", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(HH, ${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "addMinutes", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(MI, ${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "addSeconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(SS, ${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.objectOperand)})`);
relationalQueryTranslator.register(Date.prototype, "addMilliseconds", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `DATEADD(MS, ${qb.getExpressionString(exp.params[0])}, ${qb.getExpressionString(exp.objectOperand)})`);

/**
 * RegExp
 * TODO: exec,toString
 */
relationalQueryTranslator.register(RegExp.prototype, "test", (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `${qb.getExpressionString(exp.params[0])} REGEXP ${qb.getExpressionString(exp.objectOperand)}`);

/**
 * Function
 * TODO: apply,bind,call,toSource,toString
 */

//#endregion

//#region Operator

// http://dataeducation.com/bitmask-handling-part-4-left-shift-and-right-shift/
// TypeofExpression,BitwiseSignedRightShiftExpression, BitwiseZeroRightShiftExpression
// BitwiseZeroLeftShiftExpression,InstanceofExpression
const aritAssignmentTranlator = (exp: IBinaryOperatorExpression, qb: QueryBuilder, operator: string) => {
    if (!(exp.leftOperand instanceof ParameterExpression)) {
        throw new Error(`Operator ${exp.toString()} only support parameter for left operand`);
    }
    const varString = qb.getExpressionString(exp.leftOperand);
    return `${varString} = ${varString} ${operator} ${qb.getOperandString(exp.rightOperand)}`;
};
relationalQueryTranslator.register(AdditionAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, "+"));
relationalQueryTranslator.register(SubstractionAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, "-"));
relationalQueryTranslator.register(MultiplicationAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, "*"));
relationalQueryTranslator.register(DivisionAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, "/"));
relationalQueryTranslator.register(ExponentiationAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, "**"));
relationalQueryTranslator.register(ModulusAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, "%"));
relationalQueryTranslator.register(BitwiseAndAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, "&"));
relationalQueryTranslator.register(BitwiseOrAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, "|"));
relationalQueryTranslator.register(BitwiseXorAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, "^"));
relationalQueryTranslator.register(BitwiseZeroLeftShiftAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, "<<"));
relationalQueryTranslator.register(BitwiseZeroRightShiftAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, ">>"));
relationalQueryTranslator.register(BitwiseSignedRightShiftAssignmentExpression, (exp: any, qb: QueryBuilder) => aritAssignmentTranlator(exp, qb, ">>>"));

const incrementTranslator = (exp: IUnaryOperatorExpression, qb: QueryBuilder, operator: string) => {
    if (!(exp.operand instanceof ParameterExpression)) {
        throw new Error(`Operator ${exp.toString()} only support parameter operand`);
    }
    const varString = qb.getExpressionString(exp.operand);
    return `${varString} = ${varString} ${operator} 1`;
};
relationalQueryTranslator.register(LeftIncrementExpression, (exp: any, qb: QueryBuilder) => incrementTranslator(exp, qb, "+"));
relationalQueryTranslator.register(LeftDecrementExpression, (exp: any, qb: QueryBuilder) => incrementTranslator(exp, qb, "-"));
relationalQueryTranslator.register(RightIncrementExpression, (exp: any, qb: QueryBuilder) => `(${incrementTranslator(exp, qb, "+")}) - 1`);
relationalQueryTranslator.register(RightDecrementExpression, (exp: any, qb: QueryBuilder) => `(${incrementTranslator(exp, qb, "-")}) + 1`);


const binaryTranslator = (exp: IBinaryOperatorExpression, qb: QueryBuilder, operator: string) => `${qb.getOperandString(exp.leftOperand)} ${operator} ${qb.getOperandString(exp.rightOperand)}`;
relationalQueryTranslator.register(AssignmentExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, "="));
relationalQueryTranslator.register(GreaterEqualExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, ">="));
relationalQueryTranslator.register(GreaterThanExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, ">"));
relationalQueryTranslator.register(LessEqualExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, "<="));
relationalQueryTranslator.register(LessThanExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, "<"));
relationalQueryTranslator.register(ModulusExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, "%"));
relationalQueryTranslator.register(SubtractionExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, "-"));
relationalQueryTranslator.register(MultiplicationExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, "*"));
relationalQueryTranslator.register(DivisionExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, "/"));
relationalQueryTranslator.register(AdditionExpression, (exp: any, qb: QueryBuilder) => {
    if (exp.type as any === String)
        return `CONCAT(${qb.getOperandString(exp.leftOperand)}, ${qb.getOperandString(exp.rightOperand)})`;

    return `${qb.getOperandString(exp.leftOperand)} + ${qb.getOperandString(exp.rightOperand)}`;
});
relationalQueryTranslator.register(BitwiseAndExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, "&"));
relationalQueryTranslator.register(BitwiseOrExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, "|"));
relationalQueryTranslator.register(BitwiseXorExpression, (exp: any, qb: QueryBuilder) => binaryTranslator(exp, qb, "^"));

const notEqualTranslator = (exp: NotEqualExpression | StrictNotEqualExpression, qb: QueryBuilder) => {
    const leftExpString = qb.getOperandString(exp.leftOperand, true);
    const rightExpString = qb.getOperandString(exp.rightOperand, true);
    if (leftExpString === "NULL")
        return `${rightExpString} IS NOT ${leftExpString}`;
    else if (rightExpString === "NULL")
        return `${leftExpString} IS NOT ${rightExpString}`;
    return `${leftExpString} <> ${rightExpString}`;
};
relationalQueryTranslator.register(NotEqualExpression, notEqualTranslator);
relationalQueryTranslator.register(StrictNotEqualExpression, notEqualTranslator);

const equalTransalator = (exp: IBinaryOperatorExpression, qb: QueryBuilder) => {
    const leftExpString = qb.getOperandString(exp.leftOperand, true);
    const rightExpString = qb.getOperandString(exp.rightOperand, true);
    if (leftExpString === "NULL")
        return `${rightExpString} IS ${leftExpString}`;
    else if (rightExpString === "NULL")
        return `${leftExpString} IS ${rightExpString}`;
    return `${leftExpString} = ${rightExpString}`;
};
relationalQueryTranslator.register(EqualExpression, equalTransalator);
relationalQueryTranslator.register(StrictEqualExpression, equalTransalator);

relationalQueryTranslator.register(OrExpression, (exp: any, qb: QueryBuilder) => `${qb.getLogicalOperandString(exp.leftOperand)} OR ${qb.getLogicalOperandString(exp.rightOperand)}`);
relationalQueryTranslator.register(AndExpression, (exp: any, qb: QueryBuilder) => `${qb.getLogicalOperandString(exp.leftOperand)} AND ${qb.getLogicalOperandString(exp.rightOperand)}`);
relationalQueryTranslator.register(NotExpression, (exp: any, qb: QueryBuilder) => `NOT(${qb.newLine(1)}${qb.getLogicalOperandString(exp.operand)}${qb.newLine(-1)})`);
relationalQueryTranslator.register(BitwiseNotExpression, (exp: any, qb: QueryBuilder) => `~(${qb.getLogicalOperandString(exp.operand)})`);
relationalQueryTranslator.register(TernaryExpression, (exp: TernaryExpression, qb: QueryBuilder) => `(${qb.newLine(1)}CASE WHEN (${qb.getExpressionString(exp.logicalOperand)}) ${qb.newLine()}THEN ${qb.getOperandString(exp.trueResultOperand, true)}${qb.newLine()}ELSE ${qb.getOperandString(exp.falseResultOperand, true)}${qb.newLine()}END${qb.newLine(-1)})`);

//#endregion
