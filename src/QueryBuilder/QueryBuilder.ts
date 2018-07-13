import { ModulusExpression } from "../ExpressionBuilder/Expression/ModulusExpression";
import { ExpressionTransformer } from "../ExpressionBuilder/ExpressionTransformer";
import { TransformerParameter } from "../ExpressionBuilder/TransformerParameter";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { SelectExpression, IJoinRelation } from "../Queryable/QueryExpression/SelectExpression";
import { SqlFunctionCallExpression } from "../Queryable/QueryExpression/SqlFunctionCallExpression";
import { UnionExpression } from "../Queryable/QueryExpression/UnionExpression";
import { IQueryVisitParameter, QueryExpressionVisitor } from "./QueryExpressionVisitor";
import { fillZero, isNativeFunction } from "../Helper/Util";
import { JoinType, ValueType, GenericType } from "../Common/Type";
import { StringDataColumnMetaData } from "../MetaData/DataStringColumnMetaData";
import { IdentifierColumnMetaData } from "../MetaData/IdentifierColumnMetaData";
import { TimestampColumnMetaData } from "../MetaData/TimestampColumnMetaData";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../Common/ColumnType";
import { TimeColumnMetaData } from "../MetaData/TimeColumnMetaData";
import { IColumnTypeDefaults } from "../Common/IColumnTypeDefaults";
import { Enumerable } from "../Enumerable/Enumerable";
import { CustomEntityExpression } from "../Queryable/QueryExpression/CustomEntityExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { ISqlParameterBuilderItem } from "./ParameterBuilder/ISqlParameterBuilderItem";
import { columnMetaKey, entityMetaKey } from "../Decorator/DecoratorKey";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IQueryCommand } from "./Interface/IQueryCommand";
import { EntityEntry } from "../Data/EntityEntry";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IConstraintMetaData } from "../MetaData/Interface/IConstraintMetaData";
import { ICheckConstraintMetaData } from "../MetaData/Interface/ICheckConstraintMetaData";
import { IIndexMetaData } from "../MetaData/Interface/IIndexMetaData";
import { EntityState } from "../Data/EntityState";
import { RelationEntry } from "../Data/RelationEntry";
import { EmbeddedColumnExpression } from "../Queryable/QueryExpression/EmbeddedColumnExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { ColumnExpression } from "../Queryable/QueryExpression/ColumnExpression";
import { ComputedColumnExpression } from "../Queryable/QueryExpression/ComputedColumnExpression";
import { ProjectionEntityExpression } from "../Queryable/QueryExpression/ProjectionEntityExpression";
import { IBinaryOperatorExpression } from "../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IUnaryOperatorExpression } from "../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { FunctionCallExpression } from "../ExpressionBuilder/Expression/FunctionCallExpression";
import { TernaryExpression } from "../ExpressionBuilder/Expression/TernaryExpression";
import { ObjectValueExpression } from "../ExpressionBuilder/Expression/ObjectValueExpression";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { AdditionExpression } from "../ExpressionBuilder/Expression/AdditionExpression";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { BitwiseAndExpression } from "../ExpressionBuilder/Expression/BitwiseAndExpression";
import { BitwiseOrExpression } from "../ExpressionBuilder/Expression/BitwiseOrExpression";
import { BitwiseSignedRightShiftExpression } from "../ExpressionBuilder/Expression/BitwiseSignedRightShiftExpression";
import { BitwiseXorExpression } from "../ExpressionBuilder/Expression/BitwiseXorExpression";
import { BitwiseZeroLeftShiftExpression } from "../ExpressionBuilder/Expression/BitwiseZeroLeftShiftExpression";
import { BitwiseZeroRightShiftExpression } from "../ExpressionBuilder/Expression/BitwiseZeroRightShiftExpression";
import { DivisionExpression } from "../ExpressionBuilder/Expression/DivisionExpression";
import { EqualExpression } from "../ExpressionBuilder/Expression/EqualExpression";
import { GreaterEqualExpression } from "../ExpressionBuilder/Expression/GreaterEqualExpression";
import { GreaterThanExpression } from "../ExpressionBuilder/Expression/GreaterThanExpression";
import { InstanceofExpression } from "../ExpressionBuilder/Expression/InstanceofExpression";
import { LessEqualExpression } from "../ExpressionBuilder/Expression/LessEqualExpression";
import { LessThanExpression } from "../ExpressionBuilder/Expression/LessThanExpression";
import { NotEqualExpression } from "../ExpressionBuilder/Expression/NotEqualExpression";
import { OrExpression } from "../ExpressionBuilder/Expression/OrExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "../ExpressionBuilder/Expression/StrictNotEqualExpression";
import { SubtractionExpression } from "../ExpressionBuilder/Expression/SubtractionExpression";
import { MultiplicationExpression } from "../ExpressionBuilder/Expression/MultiplicationExpression";
import { BitwiseNotExpression } from "../ExpressionBuilder/Expression/BitwiseNotExpression";
import { LeftDecrementExpression } from "../ExpressionBuilder/Expression/LeftDecrementExpression";
import { LeftIncrementExpression } from "../ExpressionBuilder/Expression/LeftIncrementExpression";
import { NotExpression } from "../ExpressionBuilder/Expression/NotExpression";
import { RightDecrementExpression } from "../ExpressionBuilder/Expression/RightDecrementExpression";
import { RightIncrementExpression } from "../ExpressionBuilder/Expression/RightIncrementExpression";
import { TypeofExpression } from "../ExpressionBuilder/Expression/TypeofExpression";
import { StringColumnMetaData } from "../MetaData/StringColumnMetaData";
import { BooleanColumnMetaData } from "../MetaData/BooleanColumnMetaData";
import { DateColumnMetaData } from "../MetaData/DateColumnMetaData";
import { DecimalColumnMetaData } from "../MetaData/DecimalColumnMetaData";
import { EnumColumnMetaData } from "../MetaData/EnumColumnMetaData";
import { NumericColumnMetaData } from "../MetaData/NumericColumnMetaData";
import { IEntityExpression } from "../Queryable/QueryExpression/IEntityExpression";
import { IntersectExpression } from "../Queryable/QueryExpression/IntersectExpression";
import { ExceptExpression } from "../Queryable/QueryExpression/ExceptExpression";
import { ColumnMetaData } from "../MetaData/ColumnMetaData";
import { SqlExpression } from "../Queryable/QueryExpression/SqlExpression";
import { AssignmentExpression } from "../ExpressionBuilder/Expression/AssignmentExpression";
import { AdditionAssignmentExpression } from "../ExpressionBuilder/Expression/AdditionAssignmentExpression";
import { SubstractionAssignmentExpression } from "../ExpressionBuilder/Expression/SubstractionAssignmentExpression";
import { MultiplicationAssignmentExpression } from "../ExpressionBuilder/Expression/MultiplicationAssignmentExpression";
import { DivisionAssignmentExpression } from "../ExpressionBuilder/Expression/DivisionAssignmentExpression";
import { ExponentiationAssignmentExpression } from "../ExpressionBuilder/Expression/ExponentiationAssignmentExpression";
import { ModulusAssignmentExpression } from "../ExpressionBuilder/Expression/ModulusAssignmentExpression";
import { BitwiseAndAssignmentExpression } from "../ExpressionBuilder/Expression/BitwiseAndAssignmentExpression";
import { BitwiseXorAssignmentExpression } from "../ExpressionBuilder/Expression/BitwiseXorAssignmentExpression";
import { BitwiseOrAssignmentExpression } from "../ExpressionBuilder/Expression/BitwiseOrAssignmentExpression";
import { BitwiseZeroLeftShiftAssignmentExpression } from "../ExpressionBuilder/Expression/BitwiseZeroLeftShiftAssignmentExpression";
import { BitwiseZeroRightShiftAssignmentExpression } from "../ExpressionBuilder/Expression/BitwiseZeroRightShiftAssignmentExpression";
import { BitwiseSignedRightShiftAssignmentExpression } from "../ExpressionBuilder/Expression/BitwiseSignedRightShiftAssignmentExpression";

const memberKey = Symbol("querybuilder-member");
const methodcallKey = Symbol("querybuilder-methodcall");
// Date: UTC,now,parse
// Array: isArray

Reflect.defineMetadata(memberKey, (expression: MemberAccessExpression<any, any>, querybuilder: QueryBuilder) => "LEN(" + querybuilder.getExpressionString(expression.objectOperand) + ")", String, "length");
Reflect.defineMetadata(memberKey, () => "EXP(1)", Math, "E");
Reflect.defineMetadata(memberKey, () => "LOG(10)", Math, "LN10");
Reflect.defineMetadata(memberKey, () => "LOG(2)", Math, "LN2");
Reflect.defineMetadata(memberKey, () => "LOG10(EXP(1))", Math, "LOG10E");
Reflect.defineMetadata(memberKey, () => "LOG(EXP(1), 2)", Math, "LOG2E");
Reflect.defineMetadata(memberKey, () => "PI()", Math, "PI");
Reflect.defineMetadata(memberKey, () => "SQRT(0.5)", Math, "SQRT1_2");
Reflect.defineMetadata(memberKey, () => "SQRT(2)", Math, "SQRT2");

// SelextExpression
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `NOT EXIST(${qb.newLine(++qb.indent) + qb.getExpressionString(exp.objectOperand) + qb.newLine(--qb.indent)})`, SelectExpression, "all");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `EXIST(${qb.newLine(++qb.indent) + qb.getExpressionString(exp.objectOperand) + qb.newLine(--qb.indent)})`, SelectExpression, "any");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "COUNT(*)", SelectExpression, "count");
const aggregateTranslater = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `${exp.methodName.toUpperCase()}(${qb.getExpressionString(exp.params[0] as any)})`;
Reflect.defineMetadata(methodcallKey, aggregateTranslater, SelectExpression, "sum");
Reflect.defineMetadata(methodcallKey, aggregateTranslater, SelectExpression, "min");
Reflect.defineMetadata(methodcallKey, aggregateTranslater, SelectExpression, "max");
Reflect.defineMetadata(methodcallKey, aggregateTranslater, SelectExpression, "avg");

// Math: max,min,acosh,asinh,atanh,cbrt,clz32,fround,imul
const trigonoTranslater = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => exp.methodName.toUpperCase() + "(" + qb.getExpressionString(exp.params[0]) + ")";
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "abs");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "acos");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "asin");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "atan");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "cos");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "exp");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "sin");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "sqrt");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "tan");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "floor");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "log");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "log10");
Reflect.defineMetadata(methodcallKey, trigonoTranslater, Math, "sign");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "CEILING(" + qb.getExpressionString(exp.params[0]) + ")", Math, "ceil");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "ATN2(" + qb.getExpressionString(exp.params[0]) + "," + qb.getExpressionString(exp.params[1]) + ")", Math, "atan2");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "POWER(" + qb.getExpressionString(exp.params[0]) + "," + qb.getExpressionString(exp.params[1]) + ")", Math, "pow");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "RAND()", Math, "random");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "ROUND(" + qb.getExpressionString(exp.params[0]) + ", 0)", Math, "round");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "(EXP(" + qb.getExpressionString(exp.params[0]) + ") - 1)", Math, "expm1");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "SQRT(" + exp.params.select((p) => "POWER(" + qb.getExpressionString(p) + ", 2)").toArray().join(" + ") + ")", Math, "hypot");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "LOG(1 + " + qb.getExpressionString(exp.params[0]) + ")", Math, "log1p");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "LOG(" + qb.getExpressionString(exp.params[0]) + ", 2)", Math, "log2");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "((EXP(" + qb.getExpressionString(exp.params[0]) + ") - EXP(-" + qb.getExpressionString(exp.params[0]) + ")) / 2)", Math, "sinh");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "((EXP(" + qb.getExpressionString(exp.params[0]) + ") + EXP(-" + qb.getExpressionString(exp.params[0]) + ")) / 2)", Math, "cosh");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "((EXP(2 * " + qb.getExpressionString(exp.params[0]) + ") - 1) / (EXP(2 * " + qb.getExpressionString(exp.params[0]) + ") + 1))", Math, "tanh");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "(" + qb.getExpressionString(exp.params[0]) + " | 0)", Math, "trunc");

// String: localeCompare,match,normalize,padEnd,padStart,search,slice
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "SUBSTRING(" + qb.getExpressionString(exp.objectOperand) + ", " + qb.getExpressionString(exp.params[0]) + ", 1)", String, "charAt");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "UNICODE(SUBSTRING(" + qb.getExpressionString(exp.objectOperand) + ", " + qb.getExpressionString(exp.params[0]) + ", 1))", String, "charCodeAt");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "CONCAT(" + qb.getExpressionString(exp.objectOperand) + ", " + exp.params.select((p) => qb.getExpressionString(p)).toArray().join(", ") + ")", String, "concat");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "(" + qb.getExpressionString(exp.objectOperand) + " LIKE CONCAT(" + qb.getValueString("%") + ", " + qb.getExpressionString(exp.params[0]) + "))", String, "endsWith");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => exp.params.length > 1 ? "(" + qb.getExpressionString(exp.params[0]) + " + RIGHT(" + qb.getExpressionString(exp.objectOperand) + ", (LEN(" + qb.getExpressionString(exp.objectOperand) + ") - " + qb.getExpressionString(exp.params[0]) + "))))" : "(" + qb.getExpressionString(exp.objectOperand) + " LIKE CONCAT(" + qb.getValueString("%") + ", " + qb.getExpressionString(exp.params[0]) + ", " + qb.getValueString("%") + ")", String, "includes");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "(CHARINDEX(" + qb.getExpressionString(exp.params[0]) + ", " + qb.getExpressionString(exp.objectOperand) + (exp.params.length > 1 ? ", " + qb.getExpressionString(exp.params[1]) : "") + ") - 1)", String, "indexOf");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "(LEN(" + qb.getExpressionString(exp.objectOperand) + ") - CHARINDEX(" + qb.getExpressionString(exp.params[0]) + ", REVERSE(" + qb.getExpressionString(exp.objectOperand) + ")" + (exp.params.length > 1 ? ", " + qb.getExpressionString(exp.params[1]) : "") + "))", String, "lastIndexOf");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "(" + qb.getExpressionString(exp.objectOperand) + " LIKE " + qb.getExpressionString(exp.params[0]) + ")", String, "like");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "REPLICATE(" + qb.getExpressionString(exp.objectOperand) + ", " + qb.getExpressionString(exp.params[0]) + ")", String, "repeat");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "REPLACE(" + qb.getExpressionString(exp.objectOperand) + ", " + qb.getExpressionString(exp.params[0]) + ", " + qb.getExpressionString(exp.params[1]) + ")", String, "replace");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "STRING_SPLIT(" + qb.getExpressionString(exp.objectOperand) + ", " + qb.getExpressionString(exp.params[0]) + ")", String, "split");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "(" + qb.getExpressionString(exp.objectOperand) + " LIKE CONCAT(" + qb.getExpressionString(exp.params[0]) + ", " + qb.getValueString("%") + "))", String, "startsWith");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "SUBSTRING(" + qb.getExpressionString(exp.objectOperand) + ", " + "(" + qb.getExpressionString(exp.params[0]) + " + 1), " + (exp.params.length > 1 ? qb.getExpressionString(exp.params[1]) : "8000") + ")", String, "substr");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "SUBSTRING(" + qb.getExpressionString(exp.objectOperand) + ", " + "(" + qb.getExpressionString(exp.params[0]) + " + 1), " + (exp.params.length > 1 ? "(" + qb.getExpressionString(exp.params[1]) + " - " + qb.getExpressionString(exp.params[0]) + ")" : "8000") + ")", String, "substring");
const tolowerTranslator = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "LOWER(" + qb.getExpressionString(exp.objectOperand) + ")";
Reflect.defineMetadata(methodcallKey, tolowerTranslator, String, "toLowerCase");
Reflect.defineMetadata(methodcallKey, tolowerTranslator, String, "toLocaleLowerCase");
const toupperTranslator = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "UPPER(" + qb.getExpressionString(exp.objectOperand) + ")";
Reflect.defineMetadata(methodcallKey, toupperTranslator, String, "toUpperCase");
Reflect.defineMetadata(methodcallKey, toupperTranslator, String, "toLocaleUpperCase");
const stringValueOf = (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => qb.getExpressionString(exp.objectOperand);
Reflect.defineMetadata(methodcallKey, stringValueOf, String, "toString");
Reflect.defineMetadata(methodcallKey, stringValueOf, String, "valueOf");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "RTRIM(LTRIM(" + qb.getExpressionString(exp.objectOperand) + "))", String, "trim");

// Number: isFinite,isInteger,isNaN,isSafeInteger,toExponential,toFixed,toPrecision
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `CAST(${qb.getExpressionString(exp.objectOperand)} AS nvarchar(255))`, Number, "toString");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => qb.getExpressionString(exp.objectOperand), Number, "valueOf");

// Symbol: toString

// Boolean: 
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "(CASE WHEN (" + qb.getExpressionString(exp.objectOperand) + ") THEN " + qb.getValueString("true") + " ELSE " + qb.getValueString("false") + " END)", Number, "toString");

// Date: getTime,getTimezoneOffset,getUTCDate,getUTCDay,getUTCFullYear,getUTCHours,getUTCMilliseconds,getUTCMinutes,getUTCMonth,getUTCSeconds,getYear,setTime,setUTCDate,setUTCFullYear,setUTCHours,setUTCMilliseconds,setUTCMinutes,setUTCMonth,setUTCSeconds,toJSON,toISOString,toLocaleDateString,toLocaleTimeString,toLocaleString,toString,valueOf,toTimeString,toUTCString,toGMTString
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DAY(" + qb.getExpressionString(exp.objectOperand) + ")", Date, "getDate");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "(DATEPART(weekday, " + qb.getExpressionString(exp.objectOperand) + ") - 1)", Date, "getDay");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "YEAR(" + qb.getExpressionString(exp.objectOperand) + ")", Date, "getFullYear");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEPART(hour, " + qb.getExpressionString(exp.objectOperand) + ")", Date, "getHours");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEPART(minute, " + qb.getExpressionString(exp.objectOperand) + ")", Date, "getMinutes");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "(MONTH(" + qb.getExpressionString(exp.objectOperand) + ") - 1)", Date, "getMonth");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEPART(second, " + qb.getExpressionString(exp.objectOperand) + ")", Date, "getSeconds");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEPART(millisecond, " + qb.getExpressionString(exp.objectOperand) + ")", Date, "getMilliseconds");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEADD(DAY, (" + qb.getExpressionString(exp.params[0]) + " - DAY(" + qb.getExpressionString(exp.objectOperand) + ")), " + qb.getExpressionString(exp.objectOperand) + ")", Date, "setDate");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEADD(YYYY, (" + qb.getExpressionString(exp.params[0]) + " - YEAR(" + qb.getExpressionString(exp.objectOperand) + ")), " + qb.getExpressionString(exp.objectOperand) + ")", Date, "setFullYear");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEADD(HH, (" + qb.getExpressionString(exp.params[0]) + " - DATEPART(hour, " + qb.getExpressionString(exp.objectOperand) + ")), " + qb.getExpressionString(exp.objectOperand) + ")", Date, "setHours");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEADD(MS, (" + qb.getExpressionString(exp.params[0]) + " - DATEPART(millisecond, " + qb.getExpressionString(exp.objectOperand) + ")), " + qb.getExpressionString(exp.objectOperand) + ")", Date, "setMilliseconds");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEADD(MI, (" + qb.getExpressionString(exp.params[0]) + " - DATEPART(minute, " + qb.getExpressionString(exp.objectOperand) + ")), " + qb.getExpressionString(exp.objectOperand) + ")", Date, "setMinutes");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEADD(MM, (" + qb.getExpressionString(exp.params[0]) + " - (MONTH(" + qb.getExpressionString(exp.objectOperand) + ") - 1)), " + qb.getExpressionString(exp.objectOperand) + ")", Date, "setMonth");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "DATEADD(SS, (" + qb.getExpressionString(exp.params[0]) + " - DATEPART(second, " + qb.getExpressionString(exp.objectOperand) + ")), " + qb.getExpressionString(exp.objectOperand) + ")", Date, "setSeconds");
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => "CONCAT(LEFT(DATENAME(WEEKDAY, " + qb.getExpressionString(exp.objectOperand) + "), 3), " + qb.getValueString(" ") + ", " + "LEFT(DATENAME(MONTH, " + qb.getExpressionString(exp.objectOperand) + "), 3), " + qb.getValueString(" ") + ", " + "RIGHT(CONCAT(" + qb.getValueString("0") + ", RTRIM(MONTH(" + qb.getExpressionString(exp.objectOperand) + "))), 2)" + qb.getValueString(" ") + ", " + "RIGHT(CONCAT(" + qb.getValueString("0") + ", RTRIM(MONTH(" + qb.getExpressionString(exp.objectOperand) + "))), 2))", Date, "toDateString");

// RegExp: exec,toString
Reflect.defineMetadata(methodcallKey, (exp: MethodCallExpression<any, any>, qb: QueryBuilder) => `${qb.getExpressionString(exp.params[0])} REGEXP ${qb.getExpressionString(exp.objectOperand)}`, RegExp, "pow");

// Function: apply,bind,call,toSource,toString
// Array: contains,concat,copyWithin,every,fill,filter,find,findIndex,forEach,indexOf,join,lastIndexOf,map,pop,push,reduce,reduceRight,reverse,shift,slice,some,sort,splice,toString,unshift,valueOf

export abstract class QueryBuilder extends ExpressionTransformer {
    protected get userParameters() {
        return this.queryVisitor.userParameters;
    }
    public get sqlParameterBuilderItems(): ISqlParameterBuilderItem[] {
        return this.queryVisitor.sqlParameterBuilderItems;
    }
    public addParameters(param: { [key: string]: any }) {
        Object.assign(this.userParameters, param);
    }
    public get scopeParameters(): TransformerParameter {
        return this.queryVisitor.scopeParameters;
    }
    public namingStrategy: NamingStrategy = new NamingStrategy();
    protected queryVisitor: QueryExpressionVisitor = new QueryExpressionVisitor(this.namingStrategy);
    protected indent = 0;
    public newAlias(type?: "entity" | "column" | "param") {
        return this.queryVisitor.newAlias(type);
    }
    public enclose(identity: string) {
        if (this.namingStrategy.enableEscape && identity[0] !== "@" && identity[0] !== "#")
            return "\"" + identity + "\"";
        else
            return identity;
    }
    public visit(expression: IExpression, param: IQueryVisitParameter): IExpression {
        return this.queryVisitor.visit(expression, param);
    }
    public getExpressionString<T = any>(expression: IExpression<T>): string {
        if (expression instanceof SelectExpression) {
            return this.getSelectQueryString(expression) + ";";
        }
        else if (expression instanceof ColumnExpression || expression instanceof ComputedColumnExpression) {
            return this.getColumnString(expression);
        }
        else if (expression instanceof EntityExpression || expression instanceof ProjectionEntityExpression) {
            return this.getEntityQueryString(expression);
        }
        else if ((expression as IBinaryOperatorExpression).rightOperand) {
            return this.getBinaryOperatorString(expression as any);
        }
        else if ((expression as IUnaryOperatorExpression).operand) {
            return this.getUnaryOperatorString(expression as any);
        }
        else {
            let result = "";
            switch (expression.constructor) {
                case SqlFunctionCallExpression:
                    result = this.getSqlFunctionCallExpressionString(expression as any);
                    break;
                case MemberAccessExpression:
                    result = this.getMemberAccessExpressionString(expression as any);
                    break;
                case MethodCallExpression:
                    result = this.getMethodCallExpressionString(expression as any);
                    break;
                case FunctionCallExpression:
                    result = this.getFunctionCallExpressionString(expression as any);
                    break;
                case TernaryExpression:
                    result = this.getTernaryExpressionString(expression as any);
                    break;
                case ObjectValueExpression:
                    result = this.getObjectValueExpressionString(expression as any);
                    break;
                case ArrayValueExpression:
                    result = this.getArrayValueExpressionString(expression as any);
                    break;
                case ParameterExpression:
                    result = this.getParameterExpressionString(expression as any);
                    break;
                case ValueExpression:
                    result = this.getValueExpressionString(expression as any);
                    break;
                // Possibly not used
                case FunctionExpression:
                    result = this.getFunctionExpressionString(expression as any);
                    break;
            }
            return result;
        }
    }
    protected getBinaryOperatorString(expression: IBinaryOperatorExpression) {
        let result = "";
        switch (expression.constructor) {
            case AdditionExpression:
                result = this.getAdditionExpressionString(expression as any);
                break;
            case AndExpression:
                result = this.getAndExpressionString(expression as any);
                break;
            case BitwiseAndExpression:
                result = this.getBitwiseAndExpressionString(expression as any);
                break;
            case BitwiseOrExpression:
                result = this.getBitwiseOrExpressionString(expression as any);
                break;
            case BitwiseSignedRightShiftExpression:
                result = this.getBitwiseSignedRightShiftExpressionString(expression as any);
                break;
            case BitwiseXorExpression:
                result = this.getBitwiseXorExpressionString(expression as any);
                break;
            case BitwiseZeroLeftShiftExpression:
                result = this.getBitwiseZeroLeftShiftExpressionString(expression as any);
                break;
            case BitwiseZeroRightShiftExpression:
                result = this.getBitwiseZeroRightShiftExpressionString(expression as any);
                break;
            case DivisionExpression:
                result = this.getDivisionExpressionString(expression as any);
                break;
            case EqualExpression:
                result = this.getEqualExpressionString(expression as any);
                break;
            case GreaterEqualExpression:
                result = this.getGreaterEqualExpressionString(expression as any);
                break;
            case GreaterThanExpression:
                result = this.getGreaterThanExpressionString(expression as any);
                break;
            case InstanceofExpression:
                result = this.getInstanceofExpressionString(expression as any);
                break;
            case LessEqualExpression:
                result = this.getLessEqualExpressionString(expression as any);
                break;
            case LessThanExpression:
                result = this.getLessThanExpressionString(expression as any);
                break;
            case NotEqualExpression:
                result = this.getNotEqualExpressionString(expression as any);
                break;
            case OrExpression:
                result = this.getOrExpressionString(expression as any);
                break;
            case StrictEqualExpression:
                result = this.getStrictEqualExpressionString(expression as any);
                break;
            case StrictNotEqualExpression:
                result = this.getStrictNotEqualExpressionString(expression as any);
                break;
            case SubtractionExpression:
                result = this.getSubtractionExpressionString(expression as any);
                break;
            case MultiplicationExpression:
                result = this.getTimesExpressionString(expression as any);
                break;
            case AssignmentExpression: {
                result = this.getAssignmentExpressionString(expression as any);
                break;
            }
            case AdditionAssignmentExpression: {
                result = this.getAdditionAssignmentExpressionString(expression as any);
                break;
            }
            case SubstractionAssignmentExpression: {
                result = this.getSubstractionAssignmentExpressionString(expression as any);
                break;
            }
            case MultiplicationAssignmentExpression: {
                result = this.getMultiplicationAssignmentExpressionString(expression as any);
                break;
            }
            case DivisionAssignmentExpression: {
                result = this.getDivisionAssignmentExpressionString(expression as any);
                break;
            }
            case ExponentiationAssignmentExpression: {
                result = this.getExponentiationAssignmentExpressionString(expression as any);
                break;
            }
            case ModulusAssignmentExpression: {
                result = this.getModulusAssignmentExpressionString(expression as any);
                break;
            }
            case BitwiseOrAssignmentExpression: {
                result = this.getBitwiseOrAssignmentExpressionString(expression as any);
                break;
            }
            case BitwiseAndAssignmentExpression: {
                result = this.getBitwiseAndAssignmentExpressionString(expression as any);
                break;
            }
            case BitwiseZeroLeftShiftAssignmentExpression: {
                result = this.getBitwiseZeroLeftShiftAssignmentExpressionString(expression as any);
                break;
            }
            case BitwiseZeroRightShiftAssignmentExpression: {
                result = this.getBitwiseZeroRightShiftAssignmentExpressionString(expression as any);
                break;
            }
            case BitwiseSignedRightShiftAssignmentExpression: {
                result = this.getBitwiseSignedRightShiftAssignmentExpressionString(expression as any);
                break;
            }
            case TernaryExpression:
                result = this.getTernaryExpressionString(expression as any);
                break;
        }
        return "(" + result + ")";
    }
    protected getUnaryOperatorString(expression: IUnaryOperatorExpression) {
        let result = "";
        switch (expression.constructor) {
            case BitwiseNotExpression:
                result = this.getBitwiseNotExpressionString(expression as any);
                break;
            case LeftDecrementExpression:
                result = this.getLeftDecrementExpressionString(expression as any);
                break;
            case LeftIncrementExpression:
                result = this.getLeftIncrementExpressionString(expression as any);
                break;
            case NotExpression:
                result = this.getNotExpressionString(expression as any);
                break;
            case RightDecrementExpression:
                result = this.getRightDecrementExpressionString(expression as any);
                break;
            case RightIncrementExpression:
                result = this.getRightIncrementExpressionString(expression as any);
                break;
            case TypeofExpression:
                result = this.getTypeofExpressionString(expression as any);
                break;
        }
        return result;
    }
    protected getColumnString(column: IColumnExpression) {
        if (column instanceof ComputedColumnExpression) {
            return this.enclose(column.columnName);
        }
        return this.enclose(column.entity.alias) + "." + this.enclose(column.columnName);
    }
    protected getJoinColumnString(entity: IEntityExpression, column: IColumnExpression) {
        if (column instanceof ComputedColumnExpression) {
            return this.getOperandString(column.expression, true);
        }
        return this.enclose(entity.alias) + "." + this.enclose(column.columnName);
    }
    protected getColumnSelectString(column: IColumnExpression): string {
        if (column instanceof EmbeddedColumnExpression) {
            return column.selects.select(o => this.getColumnSelectString(o)).toArray().join(",");
        }
        let result = this.getColumnDefinitionString(column);
        if (column instanceof ComputedColumnExpression) {
            result += " AS " + this.enclose(column.columnName);
        }
        return result;
    }
    protected getColumnDefinitionString(column: IColumnExpression): string {
        if (column instanceof ComputedColumnExpression) {
            return this.getOperandString(column.expression, true);
        }
        else if (column instanceof EmbeddedColumnExpression) {
            return column.selects.select(o => this.getColumnDefinitionString(o)).toArray().join(",");
        }
        return this.enclose(column.entity.alias) + "." + this.enclose(column.columnName);
    }
    protected getSelectQueryString(select: SelectExpression): string {
        return this.getSelectQuery(select).select(o => o.query).toArray().join(";" + this.newLine() + this.newLine());
    }
    protected getPagingQueryString(select: SelectExpression): string {
        const take = select.paging.take || 0;
        let result = "";
        if (take > 0)
            result += "LIMIT " + take + " ";
        result += "OFFSET " + select.paging.skip;
        return result;
    }
    protected getCreateTempTableString(name: string, columns: IColumnExpression[] | Enumerable<IColumnExpression>) {
        let result = "CREATE TABLE " + name;
        result += this.newLine() + "{";
        result += this.newLine(this.indent + 1) + columns.select(o => this.columnDeclaration(o)).toArray().join(this.newLine(this.indent + 1));
        result += this.newLine() + "}";
        return result;
    }
    protected getDeclareTableVariableString(name: string, columns: IColumnExpression[] | Enumerable<IColumnExpression>) {
        let result = "DECLARE " + name + "  TABLE";
        result += this.newLine() + "(";
        result += this.newLine(this.indent + 1) + columns.select(o => this.columnDeclaration(o)).toArray().join("," + this.newLine(this.indent + 1));
        result += this.newLine() + ")";
        return result;
    }
    public abstract supportedColumnTypes: Map<ColumnType, ColumnGroupType>;
    public abstract columnTypesWithOption: ColumnType[];
    public abstract columnTypeDefaults: Map<ColumnType, IColumnTypeDefaults>;
    public abstract columnTypeMap: Map<ColumnTypeMapKey, ColumnType>;
    public abstract valueTypeMap: Map<GenericType, ColumnType>;
    public getColumnType<T>(column: IColumnMetaData<T> | IColumnExpression<T> | ValueType): string {
        if (column instanceof ColumnExpression) {
            const columnExp = column as ColumnExpression;
            if (columnExp.columnType) {
                if (columnExp instanceof ColumnExpression && columnExp.columnMetaData && columnExp.columnType === columnExp.columnMetaData.columnType) {
                    return this.getColumnType(columnExp.columnMetaData);
                }
                return columnExp.columnType;
            }
        }

        let columnOption = column as IColumnMetaData<T>;
        let type: ColumnType;
        if (!(column as IColumnMetaData).columnType) {
            type = this.valueTypeMap.get(column as any);
        }
        else {
            columnOption = column as IColumnMetaData<T>;
            if (!columnOption.columnType) {
                return this.getColumnType(columnOption.type as any);
            }
            type = columnOption.columnType;
            if (!this.supportedColumnTypes.has(type)) {
                if (this.columnTypeMap) {
                    if (this.columnTypeMap.has(type))
                        type = this.columnTypeMap.get(type);
                    else if (this.columnTypeMap.has("defaultBinary") && columnOption instanceof StringColumnMetaData)
                        type = this.columnTypeMap.get("defaultBinary");
                    else if (this.columnTypeMap.has("defaultBoolean") && columnOption instanceof BooleanColumnMetaData)
                        type = this.columnTypeMap.get("defaultBoolean");
                    else if (this.columnTypeMap.has("defaultDataString") && columnOption instanceof StringDataColumnMetaData)
                        type = this.columnTypeMap.get("defaultDataString");
                    else if (this.columnTypeMap.has("defaultDate") && columnOption instanceof DateColumnMetaData)
                        type = this.columnTypeMap.get("defaultDate");
                    else if (this.columnTypeMap.has("defaultDecimal") && columnOption instanceof DecimalColumnMetaData)
                        type = this.columnTypeMap.get("defaultDecimal");
                    else if (this.columnTypeMap.has("defaultEnum") && columnOption instanceof EnumColumnMetaData)
                        type = this.columnTypeMap.get("defaultEnum");
                    else if (this.columnTypeMap.has("defaultIdentifier") && columnOption instanceof IdentifierColumnMetaData)
                        type = this.columnTypeMap.get("defaultIdentifier");
                    else if (this.columnTypeMap.has("defaultNumberic") && columnOption instanceof NumericColumnMetaData)
                        type = this.columnTypeMap.get("defaultNumberic");
                    else if (this.columnTypeMap.has("defaultString") && columnOption instanceof StringColumnMetaData)
                        type = this.columnTypeMap.get("defaultString");
                    else if (this.columnTypeMap.has("defaultTime") && columnOption instanceof TimeColumnMetaData)
                        type = this.columnTypeMap.get("defaultTime");
                    else if (this.columnTypeMap.has("defaultTimestamp") && columnOption instanceof TimestampColumnMetaData)
                        type = this.columnTypeMap.get("defaultTimestamp");
                    else
                        throw new Error(`${type} is not supported`);
                }
            }
        }
        const typeDefault = this.columnTypeDefaults.get(columnOption.columnType);
        const option = columnOption as any;
        const size: number = option && typeof option.size !== "undefined" ? option.size : typeDefault ? typeDefault.size : undefined;
        const length: number = option && typeof option.length !== "undefined" ? option.length : typeDefault ? typeDefault.length : undefined;
        const scale: number = option && typeof option.size !== "undefined" ? option.scale : typeDefault ? typeDefault.scale : undefined;
        const precision: number = option && typeof option.size !== "undefined" ? option.precision : typeDefault ? typeDefault.precision : undefined;
        if (this.columnTypesWithOption.contains(type)) {
            if (typeof length !== "undefined") {
                type += `(${length})`;
            }
            else if (typeof size !== "undefined") {
                type += `(${size})`;
            }
            else if (typeof scale !== "undefined" && typeof precision !== "undefined") {
                type += `(${precision}, ${scale})`;
            }
            else if (typeof precision !== "undefined") {
                type += `(${precision})`;
            }
        }
        return type;
    }
    protected getEntityJoinString<T>(entity: IEntityExpression<T>, joins: IJoinRelation<T, any>[]): string {
        let result = "";
        if (joins.length > 0) {
            result += this.newLine();
            result += joins.select(o => {
                let childEntString = "";
                if (o.child.isSimple())
                    childEntString = this.getEntityQueryString(o.child.entity);
                else
                    childEntString = "(" + this.newLine(++this.indent) + this.getSelectQueryString(o.child) + this.newLine(--this.indent) + ") AS " + o.child.entity.alias;
                let join = o.type + " JOIN " + childEntString +
                    this.newLine(this.indent + 1) + "ON ";

                const jstr: string[] = [];
                for (const [key, val] of o.relations) {
                    jstr.push(this.getJoinColumnString(key.entity, key) + " = " + this.getJoinColumnString(o.child.entity, val));
                }
                return join + jstr.join(" AND ");
            }).toArray().join(this.newLine());
        }
        return result;
    }
    protected newLine(indent = this.indent) {
        return "\n" + (Array(indent + 1).join("\t"));
    }
    protected getEntityQueryString(entity: IEntityExpression): string {
        if (entity instanceof IntersectExpression) {
            return "(" + this.newLine(++this.indent) + "(" + this.newLine(++this.indent) + this.getSelectQueryString(entity.select) + this.newLine(--this.indent) + ")" +
                this.newLine() + "INTERSECT" +
                this.newLine() + "(" + this.newLine(++this.indent) + this.getSelectQueryString(entity.select2) + this.newLine(--this.indent) + ")" + this.newLine(--this.indent) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof UnionExpression) {
            return "(" + this.newLine(++this.indent) + "(" + this.newLine(++this.indent) + this.getSelectQueryString(entity.select) + this.newLine(--this.indent) + ")" +
                this.newLine() + "UNION" + (entity.isUnionAll ? " ALL" : "") +
                this.newLine() + "(" + this.newLine(++this.indent) + this.getSelectQueryString(entity.select2) + this.newLine(--this.indent) + ")" + this.newLine(--this.indent) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof ExceptExpression) {
            return "(" + this.newLine(++this.indent) + "(" + this.newLine(++this.indent) + this.getSelectQueryString(entity.select) + this.newLine(--this.indent) + ")" +
                this.newLine() + "EXCEPT" +
                this.newLine() + "(" + this.newLine(++this.indent) + this.getSelectQueryString(entity.select2) + this.newLine(--this.indent) + ")" + this.newLine(--this.indent) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof ProjectionEntityExpression) {
            return "(" + this.newLine(++this.indent) + this.getSelectQueryString(entity.subSelect) + this.newLine(--this.indent) + ") AS " + this.enclose(entity.alias);
        }
        return this.enclose(entity.name) + (entity.alias ? " AS " + this.enclose(entity.alias) : "");
    }
    public entityName(entityMeta: IEntityMetaData<any>) {
        return `${entityMeta.schema ? this.enclose(entityMeta.schema) + "." : ""}${this.enclose(entityMeta.name)}`;
    }
    protected getFunctionCallExpressionString(expression: FunctionCallExpression<any>): string {
        switch (expression.functionFn) {
            case parseInt:
                return "CAST(" + this.getExpressionString(expression.params[0]) + " AS INT)";
            case parseFloat:
                return "CAST(" + this.getExpressionString(expression.params[0]) + " AS FLOAT)";
            case isNaN:
                return "ISNUMERIC(" + this.getExpressionString(expression.params[0]) + ") = 0";
            case isFinite:
            case decodeURI:
            case decodeURIComponent:
            case encodeURI:
            case encodeURIComponent:
                throw new Error(`${expression.functionName} not supported in linq to sql.`);
        }
        // TODO: ToExpression must support this parameter
        const fnExpression = ExpressionBuilder.parse(expression.functionFn, [expression.params[0].type]);
        for (let i = 0; i < fnExpression.params.length; i++) {
            const param = fnExpression.params[i];
            this.scopeParameters.add(param.name, expression.params[i]);
        }
        const result = this.getExpressionString(fnExpression.body);
        return result;
    }
    protected getSqlFunctionCallExpressionString(expression: SqlFunctionCallExpression<any>): string {
        return expression.functionName + "(" + expression.params.select((o) => this.getExpressionString(o)).toArray().join(", ") + ")";
    }
    protected getMemberAccessExpressionString(expression: MemberAccessExpression<any, any>): string {
        let translater: any;
        if (expression.objectOperand.type === Object && expression.objectOperand instanceof ValueExpression) {
            translater = Reflect.getOwnMetadata(memberKey, expression.objectOperand.value, expression.memberName);
        }
        if (!translater) {
            translater = Reflect.getOwnMetadata(memberKey, expression.objectOperand.type, expression.memberName);
        }

        if (translater) {
            return translater(expression, this);
        }
        throw new Error(`${expression.memberName} not supported.`);
    }
    protected getMethodCallExpressionString<TType, KProp extends keyof TType, TResult = any>(expression: MethodCallExpression<TType, KProp, TResult>): string {
        let translater: any;
        if (expression.objectOperand instanceof SelectExpression) {
            translater = Reflect.getOwnMetadata(methodcallKey, SelectExpression, expression.methodName);
        }
        else if (expression.objectOperand instanceof ValueExpression) {
            translater = Reflect.getOwnMetadata(methodcallKey, expression.objectOperand.value, expression.methodName);
        }

        if (!translater) {
            translater = Reflect.getOwnMetadata(methodcallKey, expression.objectOperand.type, expression.methodName);
        }

        if (translater) {
            return translater(expression, this);
        }

        const methodFn = expression.objectOperand.type.prototype[expression.methodName];
        if (!isNativeFunction(methodFn)) {
            const fnExpression = ExpressionBuilder.parse(methodFn, [expression.objectOperand.type]);
            for (let i = 0; i < fnExpression.params.length; i++) {
                const param = fnExpression.params[i];
                this.scopeParameters.add(param.name, expression.params[i]);
            }
            this.scopeParameters.add("this", expression.objectOperand);
            const result = this.getExpressionString(fnExpression.body);
            return result;
        }
        throw new Error(`${(expression.objectOperand.type as any).name}.${expression.methodName} not supported in linq to sql.`);
    }
    protected getParameterExpressionString(expression: ParameterExpression): string {
        return "@" + expression.name;
    }
    protected getValueExpressionString(expression: ValueExpression<any>): string {
        return this.getValueString(expression.value);
    }
    public getValueString(value: any): string {
        switch (typeof value) {
            case "number":
                return this.getNumberString(value);
            case "boolean":
                return this.getBooleanString(value);
            case "undefined":
                return this.getNullString();
            case "string":
                return this.getString(value);
            default:
                if (value === null)
                    return this.getNullString();
                else if (value instanceof Date)
                    return this.getDateTimeString(value);

                throw new Error("type not supported");
        }
    }
    protected getDateTimeString(value: Date): string {
        return this.getString(value.getFullYear() + "-" + fillZero(value.getMonth() + 1) + "-" + fillZero(value.getDate()) + " " +
            fillZero(value.getHours()) + ":" + fillZero(value.getMinutes()) + ":" + fillZero(value.getSeconds()));
    }
    protected getNullString() {
        return "NULL";
    }
    protected getString(value: string) {
        return "'" + this.escapeString(value) + "'";
    }
    protected escapeString(value: string) {
        return value.replace(/'/ig, "''");
    }
    protected getBooleanString(value: boolean) {
        return "CAST(" + (value ? "1" : "0") + " AS BIT)";
    }
    protected getNumberString(value: number) {
        return value.toString();
    }
    protected getFunctionExpressionString<T>(expression: FunctionExpression<T>): string {
        throw new Error(`Function not supported`);
    }
    protected getTernaryExpressionString<T>(expression: TernaryExpression<T>): string {
        return "(" + this.newLine(++this.indent) + "CASE WHEN (" + this.getExpressionString(expression.logicalOperand) + ") " + this.newLine() + "THEN " + this.getOperandString(expression.trueResultOperand, true) + this.newLine() + "ELSE " + this.getOperandString(expression.falseResultOperand, true) + this.newLine() + "END" + this.newLine(--this.indent) + ")";
    }
    protected getObjectValueExpressionString<T extends { [Key: string]: IExpression }>(_expression: ObjectValueExpression<T>): string {
        throw new Error(`ObjectValue not supported`);
    }
    protected getArrayValueExpressionString<T>(expression: ArrayValueExpression<T>): string {
        throw new Error(`ArrayValue not supported`);
    }
    protected getAssignmentExpressionString(expression: AssignmentExpression) {
        return this.getExpressionString(expression.leftOperand) + " = " + this.getOperandString(expression.rightOperand);
    }
    protected getAdditionAssignmentExpressionString(expression: AdditionAssignmentExpression<any>) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " + " + this.getOperandString(expression.rightOperand);
    }
    protected getSubstractionAssignmentExpressionString(expression: SubstractionAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " - " + this.getOperandString(expression.rightOperand);
    }
    protected getMultiplicationAssignmentExpressionString(expression: MultiplicationAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " * " + this.getOperandString(expression.rightOperand);
    }
    protected getDivisionAssignmentExpressionString(expression: DivisionAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " / " + this.getOperandString(expression.rightOperand);
    }
    protected getExponentiationAssignmentExpressionString(expression: ExponentiationAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " ** " + this.getOperandString(expression.rightOperand);
    }
    protected getModulusAssignmentExpressionString(expression: ModulusAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " % " + this.getOperandString(expression.rightOperand);
    }
    protected getBitwiseAndAssignmentExpressionString(expression: BitwiseAndAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " & " + this.getOperandString(expression.rightOperand);
    }
    protected getBitwiseOrAssignmentExpressionString(expression: BitwiseOrAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " | " + this.getOperandString(expression.rightOperand);
    }
    protected getBitwiseXorAssignmentExpressionString(expression: BitwiseXorAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " ^ " + this.getOperandString(expression.rightOperand);
    }
    protected getBitwiseZeroLeftShiftAssignmentExpressionString(expression: BitwiseZeroLeftShiftAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " << " + this.getOperandString(expression.rightOperand);
    }
    protected getBitwiseZeroRightShiftAssignmentExpressionString(expression: BitwiseZeroRightShiftAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " >> " + this.getOperandString(expression.rightOperand);
    }
    protected getBitwiseSignedRightShiftAssignmentExpressionString(expression: BitwiseSignedRightShiftAssignmentExpression) {
        const varString = this.getExpressionString(expression.leftOperand);
        return varString + " = " + varString + " >>> " + this.getOperandString(expression.rightOperand);
    }
    protected getDivisionExpressionString(expression: DivisionExpression): string {
        return this.getOperandString(expression.leftOperand) + " / " + this.getOperandString(expression.rightOperand);
    }
    protected getEqualityOperandExpressionString(expression: IExpression) {
        return expression;
    }
    protected getEqualExpressionString(expression: EqualExpression): string {
        const leftExpString = this.getOperandString(expression.leftOperand, true);
        const rightExpString = this.getOperandString(expression.rightOperand, true);
        if (leftExpString === "NULL")
            return rightExpString + " IS " + leftExpString;
        else if (rightExpString === "NULL")
            return leftExpString + " IS " + rightExpString;
        return leftExpString + " = " + rightExpString;
    }
    protected getGreaterEqualExpressionString<T>(expression: GreaterEqualExpression<T>): string {
        return this.getOperandString(expression.leftOperand) + " >= " + this.getOperandString(expression.rightOperand);
    }
    protected getGreaterThanExpressionString<T>(expression: GreaterThanExpression<T>): string {
        return this.getOperandString(expression.leftOperand) + " > " + this.getOperandString(expression.rightOperand);
    }
    protected getInstanceofExpressionString(expression: InstanceofExpression): string {
        throw new Error(`InstanceofExpression not supported`);
    }
    protected getLessEqualExpressionString<T>(expression: LessEqualExpression<T>): string {
        return this.getOperandString(expression.leftOperand) + " <= " + this.getOperandString(expression.rightOperand);
    }
    protected getLessThanExpressionString<T>(expression: LessThanExpression<T>): string {
        return this.getOperandString(expression.leftOperand) + " < " + this.getOperandString(expression.rightOperand);
    }
    protected getModulusExpressionString(expression: ModulusExpression): string {
        return this.getOperandString(expression.leftOperand) + " % " + this.getOperandString(expression.rightOperand);
    }
    protected getNotEqualExpressionString(expression: NotEqualExpression): string {
        const leftExpString = this.getOperandString(expression.leftOperand, true);
        const rightExpString = this.getOperandString(expression.rightOperand, true);
        if (leftExpString === "NULL")
            return rightExpString + " IS NOT " + leftExpString;
        else if (rightExpString === "NULL")
            return leftExpString + " IS NOT " + rightExpString;
        return leftExpString + " <> " + rightExpString;
    }
    protected getOrExpressionString(expression: OrExpression): string {
        return this.getLogicalOperandString(expression.leftOperand) + " OR " + this.getLogicalOperandString(expression.rightOperand);
    }
    protected getStrictEqualExpressionString<T>(expression: StrictEqualExpression<T>): string {
        return this.getEqualExpressionString(expression);
    }
    protected getStrictNotEqualExpressionString(expression: StrictNotEqualExpression): string {
        return this.getNotEqualExpressionString(expression);
    }
    protected getSubtractionExpressionString(expression: SubtractionExpression): string {
        return this.getOperandString(expression.leftOperand) + " - " + this.getOperandString(expression.rightOperand);
    }
    protected getTimesExpressionString(expression: MultiplicationExpression): string {
        return this.getOperandString(expression.leftOperand) + " * " + this.getOperandString(expression.rightOperand);
    }
    protected getAdditionExpressionString<T extends string | number>(expression: AdditionExpression<T>): string {
        if (expression.type as any === String)
            return "CONCAT(" + this.getOperandString(expression.leftOperand) + ", " + this.getOperandString(expression.rightOperand) + ")";

        return this.getOperandString(expression.leftOperand) + " + " + this.getOperandString(expression.rightOperand);
    }
    protected getOperandString(expression: IExpression, convertBoolean = false): string {
        if (expression instanceof EntityExpression || expression instanceof ProjectionEntityExpression) {
            const column = expression.primaryColumns.length > 0 ? expression.primaryColumns[0] : expression.columns[0];
            return this.getColumnString(column);
        }
        else if (convertBoolean && expression.type === Boolean && !(expression instanceof ValueExpression) && !(expression as IColumnExpression).entity) {
            expression = new TernaryExpression(expression, new ValueExpression(true), new ValueExpression(false));
        }

        return this.getExpressionString(expression);
    }
    protected getLogicalOperandString(expression: IExpression<boolean>) {
        if (expression instanceof ColumnExpression || expression instanceof ComputedColumnExpression) {
            expression = new EqualExpression(expression, new ValueExpression(true));
        }
        return this.getExpressionString(expression);
    }
    protected getAndExpressionString(expression: AndExpression): string {
        return this.getLogicalOperandString(expression.leftOperand) + " AND " + this.getLogicalOperandString(expression.rightOperand);
    }
    protected getLeftDecrementExpressionString(_expression: LeftDecrementExpression): string {
        throw new Error(`LeftDecrement not supported`);
    }
    protected getLeftIncrementExpressionString(_expression: LeftIncrementExpression): string {
        throw new Error(`LeftIncrement not supported`);
    }
    protected getNotExpressionString(expression: NotExpression): string {
        const operandString = this.getLogicalOperandString(expression.operand);
        return "NOT(" + this.newLine(this.indent + 1) + operandString + this.newLine(this.indent) + ")";
    }
    protected getRightDecrementExpressionString(_expression: RightIncrementExpression): string {
        throw new Error(`RightDecrement not supported`);
    }
    protected getRightIncrementExpressionString(_expression: RightIncrementExpression): string {
        throw new Error(`RightIncrement not supported`);
    }
    protected getTypeofExpressionString(_expression: TypeofExpression): string {
        throw new Error(`Typeof not supported`);
    }
    protected getBitwiseNotExpressionString(expression: BitwiseNotExpression): string {
        const operandString = this.getOperandString(expression.operand);
        return "~ " + operandString;
    }
    protected getBitwiseAndExpressionString(expression: BitwiseAndExpression): string {
        return this.getOperandString(expression.leftOperand) + " & " + this.getOperandString(expression.rightOperand);
    }
    protected getBitwiseOrExpressionString(expression: BitwiseOrExpression): string {
        return this.getOperandString(expression.leftOperand) + " | " + this.getOperandString(expression.rightOperand);
    }
    protected getBitwiseXorExpressionString(expression: BitwiseXorExpression): string {
        return this.getOperandString(expression.leftOperand) + " ^ " + this.getOperandString(expression.rightOperand);
    }
    // http://dataeducation.com/bitmask-handling-part-4-left-shift-and-right-shift/
    protected getBitwiseSignedRightShiftExpressionString(_expression: BitwiseSignedRightShiftExpression): string {
        throw new Error(`BitwiseSignedRightShift not supported`);
    }
    protected getBitwiseZeroRightShiftExpressionString(_expression: BitwiseZeroRightShiftExpression): string {
        throw new Error(`BitwiseSignedRightShift not supported`);
    }
    protected getBitwiseZeroLeftShiftExpressionString(_expression: BitwiseZeroLeftShiftExpression): string {
        throw new Error(`BitwiseSignedRightShift not supported`);
    }
    public getSelectQuery<T>(select: SelectExpression<T>): IQueryCommand[] {
        let result: IQueryCommand[] = [];
        const skip = select.paging.skip || 0;
        const take = select.paging.take || 0;
        const tempTableName = "#temp_" + (select.entity.alias ? select.entity.alias : select.entity.name);
        let selectQuery = "SELECT" + (select.distinct ? " DISTINCT" : "") + (skip <= 0 && take > 0 ? " TOP " + take : "") +
            " " + select.projectedColumns.select((o) => this.getColumnSelectString(o)).toArray().join("," + this.newLine(this.indent + 1)) +
            (select.includes.length > 0 ? this.newLine() + "INTO " + tempTableName : "") +
            this.newLine() + "FROM " + this.getEntityQueryString(select.entity) +
            this.getEntityJoinString(select.entity, select.joins);
        if (select.where)
            selectQuery += this.newLine() + "WHERE " + this.getOperandString(select.where);
        if (select instanceof GroupByExpression) {
            if (select.groupBy.length > 0) {
                selectQuery += this.newLine() + "GROUP BY " + select.groupBy.select((o) => this.getColumnDefinitionString(o)).toArray().join(", ");
            }
            if (select.having) {
                selectQuery += this.newLine() + "HAVING " + this.getOperandString(select.having);
            }
        }
        if (select.orders.length > 0)
            selectQuery += this.newLine() + "ORDER BY " + select.orders.select((c) => this.getExpressionString(c.column) + " " + c.direction).toArray().join(", ");

        if (skip > 0) {
            selectQuery += this.newLine() + this.getPagingQueryString(select);
        }
        result.push({
            query: selectQuery
        });
        // if has other includes, then convert to temp table
        if (select.includes.length > 0) {
            result.push({
                query: "SELECT * FROM " + tempTableName
            });

            const tempSelect = new SelectExpression(new CustomEntityExpression(tempTableName, select.projectedColumns.select(o => {
                if (o instanceof ComputedColumnExpression)
                    return new ColumnExpression(o.entity, o.type, o.propertyName, o.columnName, o.isPrimary);
                return o;
            }).toArray(), select.itemType, this.newAlias()));
            // select each include as separated query as it more beneficial for performance
            for (const include of select.includes) {
                // add join to temp table
                const reverseRelation = new Map();
                for (const [key, value] of include.relations) {
                    const tempKey = tempSelect.entity.columns.first(o => o.columnName === key.columnName);
                    reverseRelation.set(value, tempKey);
                }
                const tempJoin = include.child.addJoinRelation(tempSelect, reverseRelation, JoinType.INNER);
                result = result.concat(this.getSelectQuery(include.child));
                include.child.joins.remove(tempJoin);
            }

            result.push({
                query: "DROP TABLE " + tempTableName
            });
        }
        return result;
    }
    public updateQueries<T>(select: SelectExpression<T>, parameters: Map<string, any>, set: { [key: string]: ValueType | IExpression<any> }): IQueryCommand[] {
        let result: IQueryCommand[] = [];
        const setQuery = Object.keys(set).select(o => {
            const value = set[o];
            const valueStr = (value as IExpression).type ? this.getExpressionString(value as IExpression) : this.getValueString(value);
            return `${select.entity.alias}.${o} = ${valueStr}`;
        }).toArray().join(", ");
        let updateQuery = `UPDATE ${this.enclose(select.entity.alias)}` +
            this.newLine() + `SET ${setQuery}` +
            this.newLine() + `FROM ${this.enclose(select.entity.name)} ${this.enclose(select.entity.alias)} ` +
            this.getEntityJoinString(select.entity, select.joins);
        if (select.where)
            updateQuery += this.newLine() + "WHERE " + this.getOperandString(select.where);

        result.push({
            query: updateQuery,
            parameters: parameters
        });

        return result;
    }
    public deleteQueries<T>(select: SelectExpression<T>, parameters: Map<string, any>, isHardDelete = false): IQueryCommand[] {
        let result: IQueryCommand[] = [];
        if (!isHardDelete)
            isHardDelete = !select.entity.deleteColumn;

        // remove all entity related to this one.
        const entityMeta: IEntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, select.entity.type);
        const relations = entityMeta.relations.where(o => o.isMaster);
        result = result.concat(relations.selectMany(o => {
            let child = new SelectExpression(new EntityExpression(o.target.type, this.newAlias()));
            child.addJoinRelation(select, o.reverseRelation);
            return this.deleteQueries(select, parameters, isHardDelete);
        }).toArray());

        if (!isHardDelete) {
            // if soft delete, set delete column to true
            const set: { [key: string]: any } = {};
            set[select.entity.deleteColumn.columnName] = true;

            return this.updateQueries(select, parameters, set);
        }
        else {
            let selectQuery = `DELETE ${this.enclose(select.entity.alias)}` +
                this.newLine() + `FROM ${this.enclose(select.entity.name)} ${this.enclose(select.entity.alias)} ` +
                this.getEntityJoinString(select.entity, select.joins);
            if (select.where)
                selectQuery += this.newLine() + "WHERE " + this.getOperandString(select.where);
            result.push({
                query: selectQuery,
                parameters: parameters
            });
        }

        return result;
    }
    public lastInsertedIdentity() {
        return "LAST_INSERT_ID()";
    }
    public getInsertQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Array<EntityEntry<T>> | Enumerable<EntityEntry<T>>): IQueryCommand[] {
        const results: IQueryCommand[] = [];

        const columns = entityMetaData.columns;
        const relations = entityMetaData.relations
            .where(o => !o.nullable && !o.isMaster && o.relationType === "one");
        const relationDatas = relations.selectMany(o => o.relationColumns.select(c => ({
            column: c,
            relationProperty: o.propertyName,
            fullName: o.fullName,
            relationColumn: o.relationMaps.get(c)
        })));
        const relationColumns = relationDatas.select(o => o.column);
        const valueColumns = columns.except(relationColumns).where(o => !(o instanceof IdentifierColumnMetaData || (o instanceof NumericColumnMetaData && o.autoIncrement)));
        const columnNames = relationDatas.select(o => o.column).union(valueColumns).select(o => this.enclose(o.columnName)).toArray().join(", ");

        const getEntryValues = (entry: EntityEntry<T>, insertQuery: IQueryCommand, selectQuery: IQueryCommand, wheres: string[]) => {
            const res = relationDatas.select(o => {
                // set relation as unchanged (coz already handled here)
                const parentEntity = entry.entity[o.relationProperty] as any;
                if (!parentEntity) {
                    throw new Error(`${o.relationProperty} cannot be null`);
                }

                // TODO: need revisit. coz should not change any state before all data has been saved.
                // Don't set relation entry to unchanged, but filter logic should be implemented on relation add.
                const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                if (parentEntry) {
                    const relationGroup = entry.relationMap[o.fullName];
                    if (relationGroup) {
                        const relationEntry = relationGroup.get(parentEntry.key);
                        if (relationEntry)
                            relationEntry.changeState(EntityState.Unchanged);
                    }
                }

                let paramName = "";
                let value: any = undefined;
                if (parentEntry.state === EntityState.Added) {
                    // if parent entry is added, to used inserted values in case column is auto increment or use default.
                    const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.dbSet.metaData).indexOf(parentEntry);
                    paramName = `__${parentEntry.dbSet.metaData.name}_${o.relationColumn.columnName}_${index}`;
                }
                else {
                    value = parentEntity[o.relationColumn.propertyName];
                    paramName = this.newAlias("param");
                }

                insertQuery.parameters.set(paramName, value);
                if (o.column.isPrimaryColumn) {
                    wheres.push(`${this.enclose(o.column.columnName)} = @${paramName}`);
                    selectQuery.parameters.set(paramName, value);
                }
                return "@" + paramName;
            }).union(valueColumns.select(o => {
                let value = entry.entity[o.propertyName as keyof T];
                if (value === undefined) {
                    if (o.default)
                        return "DEFAULT";
                    return "NULL";
                }
                else {
                    const paramName = this.newAlias("param");
                    insertQuery.parameters.set(paramName, value);

                    if (o.isPrimaryColumn) {
                        wheres.push(`${this.enclose(o.columnName)} = @${paramName}`);
                        selectQuery.parameters.set(paramName, value);
                    }

                    return "@" + paramName;
                }
            })).toArray().join(",");

            return res;
        };

        const generatedColumns = columns.where(o => {
            return o.default !== undefined || (o as any as NumericColumnMetaData).autoIncrement;
        }).select(o => this.enclose(o.columnName)).toArray().join(",");

        if (entityMetaData.hasIncrementPrimary) {
            // if primary key is auto increment, then need to split all query per entry.
            const incrementColumn = entityMetaData.primaryKeys.first(o => (o as any as NumericColumnMetaData).autoIncrement);

            for (const entry of entries) {
                const insertQuery: IQueryCommand = {
                    query: "",
                    parameters: new Map()
                };
                const selectQuery: IQueryCommand = {
                    query: "",
                    parameters: new Map()
                };
                const wheres: string[] = [];
                insertQuery.query = `INSERT INTO ${this.entityName(entityMetaData)}(${columnNames})` +
                    ` VALUES (${getEntryValues(entry, insertQuery, selectQuery, wheres)})`;
                results.push(insertQuery);

                // get all inserted value to map all auto generated or default value to model.
                wheres.push(`${this.enclose(incrementColumn.columnName)} = ${this.lastInsertedIdentity()}`);
                selectQuery.query = `SELECT ${generatedColumns} FROM ${this.entityName(entityMetaData)} WHERE (${wheres.join(" AND ")})`;

                results.push(selectQuery);
            }
        }
        else {
            const insertQuery: IQueryCommand = {
                query: "",
                parameters: new Map()
            };
            const selectQuery: IQueryCommand = {
                query: "",
                parameters: new Map()
            };
            let selectWheres: string[] = [];

            insertQuery.query = `INSERT INTO ${this.entityName(entityMetaData)}(${columnNames}) VALUES `;
            insertQuery.query += entries.select(entry => {
                const wheres: string[] = [];
                const res = "(" + getEntryValues(entry, insertQuery, selectQuery, wheres) + ")";
                selectWheres.push(wheres.join(" AND "));
                return res;
            }).toArray().join(",");

            results.push(insertQuery);

            // get all inserted value to map all auto generated or default value to model.
            selectQuery.query = `SELECT ${generatedColumns} FROM ${this.entityName(entityMetaData)} WHERE (${selectWheres.join(") OR (")})`;

            results.push(selectQuery);
        }

        return results;
    }
    public getUpdateQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Array<EntityEntry<T>> | Enumerable<EntityEntry<T>>): IQueryCommand[] {
        return entries.select(entry => {
            const modifiedColumns = entry.getModifiedProperties().select(o => ({
                propertyName: o,
                metaData: Reflect.getMetadata(columnMetaKey, entityMetaData.type, o) as ColumnMetaData
            }));

            const result: IQueryCommand = {
                query: "",
                parameters: new Map()
            };
            const set = modifiedColumns.select(o => {
                const paramName = this.newAlias("param");
                result.parameters.set(paramName, entry.entity[o.propertyName as keyof T]);
                return `${this.enclose(o.metaData.columnName)} = @${paramName}`;
            }).toArray().join(",\n");

            const where = entityMetaData.primaryKeys.select(o => {
                const paramName = this.newAlias("param");
                result.parameters.set(paramName, entry.entity[o.propertyName]);
                return this.enclose(o.columnName) + " = @" + paramName;
            }).toArray().join(" AND ");

            result.query = `UPDATE ${this.entityName(entityMetaData)} SET ${set} WHERE ${where}`;
            return result;
        }).toArray();
    }
    public getDeleteQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Array<EntityEntry<T>>, forceHardDelete?: boolean): IQueryCommand[] {
        let results: IQueryCommand[] = [];
        if (entries.length <= 0)
            return null;

        const deleteExp = new SelectExpression(new EntityExpression(entityMetaData.type, this.newAlias()));
        if (entityMetaData.primaryKeys.length === 1) {
            const parameters = new Map();
            const primaryCol = entityMetaData.primaryKeys.first();
            const primaryValues = entries.select(o => {
                const paramName = this.newAlias("param");
                parameters.set(paramName, o.entity[primaryCol.propertyName]);
                return `@${paramName}`;
            }).toArray().join(",");
            const condition = `${primaryCol.propertyName} IN (${primaryValues})`;
            deleteExp.addWhere(new SqlExpression<boolean>(Boolean, condition));

            return this.deleteQueries(deleteExp, parameters, forceHardDelete);
        }
        else {
            const tempTableName = "#" + this.newAlias();
            const tempEntity = new CustomEntityExpression(tempTableName, [], deleteExp.itemType, this.newAlias());
            tempEntity.columns = entityMetaData.primaryKeys.select(o => {
                return new ColumnExpression(tempEntity, o.type, o.propertyName, o.columnName, true);
            }).toArray();
            const tempSelect = new SelectExpression(tempEntity);

            const relationMap = new Map();
            for (const primaryCol of deleteExp.entity.primaryColumns) {
                const childCol = tempEntity.columns.first(o => o.columnName === primaryCol.columnName);
                relationMap.set(primaryCol, childCol);
            }
            deleteExp.addJoinRelation(tempSelect, relationMap, JoinType.INNER);

            // set temp table data.
            results.push({
                query: this.getCreateTempTableString(tempTableName, tempEntity.columns)
            });

            // add value to temp table.
            const parameters = new Map();
            const primaryValues = entries.select(o => "(" + entityMetaData.primaryKeys.select(c => {
                const paramName = this.newAlias("param");
                parameters.set(paramName, o.entity[c.propertyName]);
                return `@${paramName}`;
            }).toArray().join(",") + ")").toArray().join(",");
            results.push({
                query: `INSERT INTO ${tempTableName} VALUES ${primaryValues}`,
                parameters: parameters
            });
            results = results.concat(this.deleteQueries(deleteExp, new Map()));

            // remove temp table
            results.push({
                query: `DROP TABLE ${tempTableName}`
            });

            return results;
        }
    }
    public getRelationAddQueries<T, T2, TData>(slaveEntityMetaData: IEntityMetaData<T>, relationEntries: Array<RelationEntry<T, T2, TData>> | Enumerable<RelationEntry<T, T2, TData>>): IQueryCommand[] {
        return relationEntries.selectMany(relationEntry => {
            const results: IQueryCommand[] = [];

            const isMasterAdded = relationEntry.masterEntry.state === EntityState.Added;
            if (relationEntry.slaveRelation.relationType === "one") {
                const parameters = new Map();
                const set = relationEntry.slaveRelation.relationColumns.select(o => {
                    let paramName = "";
                    let value: any;
                    if (isMasterAdded) {
                        // if parent entry is added, to used inserted values in case column is auto increment or use default.
                        const index = relationEntry.masterEntry.dbSet.dbContext.entityEntries.add.get(relationEntry.masterEntry.dbSet.metaData).indexOf(relationEntry.masterEntry);
                        paramName = `__${relationEntry.masterEntry.dbSet.metaData.name}_${o.columnName}_${index}`;
                    }
                    else {
                        const reverseProperty = relationEntry.slaveRelation.relationMaps.get(o).propertyName;
                        value = relationEntry.masterEntry.entity[reverseProperty as keyof T2];
                        paramName = this.newAlias("param");
                    }
                    parameters.set(paramName, value);

                    return `${this.enclose(o.columnName)} = @${paramName}`;
                }).toArray().join(",\n");
                const where = slaveEntityMetaData.primaryKeys.select(o => {
                    const paramName = this.newAlias("param");
                    parameters.set(paramName, relationEntry.slaveEntry.entity[o.propertyName]);
                    return this.enclose(o.columnName) + " = @" + paramName;
                }).toArray().join(" AND ");

                results.push({
                    query: `UPDATE ${slaveEntityMetaData.name} SET ${set} WHERE ${where}`,
                    parameters: parameters
                });
            }
            else {
                const parameters = new Map();
                const relationDataMeta = relationEntry.slaveRelation.relationData;
                const columnNames = relationDataMeta.sourceRelationColumns.union(relationDataMeta.targetRelationColumns)
                    .select(o => o.columnName).toArray().join(",");
                const values = relationDataMeta.sourceRelationColumns.select(o => {
                    let paramName = "";
                    let value: any;
                    const sourceCol = relationDataMeta.sourceRelationMaps.get(o);
                    if (isMasterAdded) {
                        // if parent entry is added, to used inserted values in case column is auto increment or use default.
                        const index = relationEntry.masterEntry.dbSet.dbContext.entityEntries.add.get(relationEntry.masterEntry.dbSet.metaData).indexOf(relationEntry.masterEntry);
                        paramName = `__${relationEntry.masterEntry.dbSet.metaData.name}_${sourceCol.columnName}_${index}`;
                    }
                    else {
                        const relProperty = sourceCol.propertyName as keyof T2;
                        value = relationEntry.masterEntry.entity[relProperty];
                        paramName = this.newAlias("param");
                    }

                    parameters.set(paramName, value);
                    return "@" + paramName;
                }).union(relationDataMeta.targetRelationColumns.except(relationDataMeta.sourceRelationColumns).select(o => {
                    let paramName = "";
                    let value: any;
                    const targetCol = relationDataMeta.targetRelationMaps.get(o);
                    if (isMasterAdded) {
                        // if parent entry is added, to used inserted values in case column is auto increment or use default.
                        const index = relationEntry.slaveEntry.dbSet.dbContext.entityEntries.add.get(relationEntry.slaveEntry.dbSet.metaData).indexOf(relationEntry.slaveEntry);
                        paramName = `__${relationEntry.masterEntry.dbSet.metaData.name}_${targetCol.columnName}_${index}`;
                    }
                    else {
                        const relProperty = targetCol.propertyName as keyof T;
                        value = relationEntry.slaveEntry.entity[relProperty];
                        paramName = this.newAlias("param");
                    }

                    parameters.set(paramName, value);
                    return "@" + paramName;
                })).toArray().join(",");

                results.push({
                    query: `INSERT INTO ${this.enclose(relationDataMeta.name)}(${columnNames}) VALUES (${values})`,
                    parameters: parameters
                });
            }
            return results;
        }).toArray();
    }
    public getRelationDeleteQueries<T, T2, TData>(entityMetaData: IEntityMetaData<T>, relationEntries: Array<RelationEntry<T, T2, TData>> | Enumerable<RelationEntry<T, T2, TData>>): IQueryCommand[] {
        return relationEntries.selectMany(relationEntry => {
            const relations = relationEntry.slaveEntry.relationMap[relationEntry.slaveRelation.fullName];
            if (relationEntry.slaveRelation.relationType === "one") {
                // if there is existing same relation but not deleted, then no need delete.
                // don't re delete FK for the same relation. only execute first.
                const relationKeys = Object.keys(relations);
                if (relations.get(relationKeys.first()) !== relationEntry || relationKeys.any(o => relations.get(o).state !== EntityState.Deleted)) {
                    return [];
                }

                if (relationEntry.slaveRelation.nullable) {
                    // Set foreignkey to null query.
                    const set = relationEntry.slaveRelation.relationColumns.select(o =>
                        `${this.enclose(o.columnName)} = NULL`
                    ).toArray().join(",\n");
                    const parameters = new Map();
                    const where = entityMetaData.primaryKeys.select(o => {
                        const paramName = this.newAlias("param");
                        parameters.set(paramName, relationEntry.slaveEntry.entity[o.propertyName]);
                        return this.enclose(o.columnName) + " = @" + paramName;
                    }).toArray().join(" AND ");
                    return [{
                        query: `UPDATE ${entityMetaData.name} SET ${set} WHERE ${where}`,
                        parameters: parameters
                    }];
                }
                else {
                    // if not nullable, then delete slave entity.
                    return this.getDeleteQueries(relationEntry.slaveRelation.source, [relationEntry.slaveEntry]);
                }
            }
            else {
                // remove relation table.
                // after save remove all reference to this relation entry
                const parameter = new Map();
                const relationDataMeta = relationEntry.slaveRelation.relationData;
                const condition = relationDataMeta.sourceRelationColumns.select(o => {
                    const relProperty = relationDataMeta.sourceRelationMaps.get(o).propertyName as keyof T2;
                    const value = relationEntry.masterEntry.entity[relProperty];
                    const paramName = this.newAlias("param");
                    parameter.set(paramName, value);
                    return this.enclose(o.columnName) + " = @" + paramName;
                }).union(relationDataMeta.targetRelationColumns.except(relationDataMeta.sourceRelationColumns).select(o => {
                    const relProperty = relationDataMeta.sourceRelationMaps.get(o).propertyName as keyof T;
                    const value = relationEntry.slaveEntry.entity[relProperty];
                    const paramName = this.newAlias("param");
                    parameter.set(paramName, value);
                    return this.enclose(o.columnName) + " = @" + paramName;
                })).toArray().join(" AND ");

                return [{
                    query: `DELETE FROM ${this.enclose(entityMetaData.name)} WHERE ${condition}`,
                    parameters: parameter
                }];
            }
        }).toArray();
    }

    /**
     * SCHEMA BUILDER QUERY
     */
    public rebuildEntitySchemaQuery<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>) {
        const columnMetas = schema.columns.select(o => ({
            columnSchema: o,
            oldColumnSchema: oldSchema.columns.first(c => c.columnName === o.columnName)
        }));

        let result: IQueryCommand[] = [];

        const cloneSchema = Object.assign({}, schema);
        cloneSchema.name = "TEMP_" + this.newAlias();

        result = result.concat(this.createEntitySchemaQuery(cloneSchema));

        // turn on identity insert coz rebuild schema most likely called because identity insert issue.
        result.push({
            query: `SET IDENTITY_INSERT ${this.entityName(cloneSchema)} ON`
        });

        // copy value
        const newColumns = columnMetas.where(o => !!o.oldColumnSchema).select(o => this.enclose(o.columnSchema.columnName)).toArray().join(",");
        const copyColumns = columnMetas.where(o => !!o.oldColumnSchema).select(o => this.enclose(o.oldColumnSchema.columnName)).toArray().join(",");
        result.push({
            query: `INSERT INTO ${this.entityName(cloneSchema)} (${newColumns}) SELECT ${copyColumns} FROM ${this.entityName(oldSchema)} WITH (HOLDLOCK TABLOCKX)`
        });

        // turn of identity insert
        result.push({
            query: `SET IDENTITY_INSERT ${this.entityName(cloneSchema)} OFF`
        });

        // remove all foreignkey reference to current table
        result = result.concat(this.dropAllMasterRelationsQuery(oldSchema));

        // rename temp table
        result = result.concat(this.renameTableQuery(cloneSchema, this.entityName(schema)));

        // re-add all foreignkey reference to table
        result = result.concat(this.addAllMasterRelationsQuery(schema));

        return result;
    }
    public dropAllOldRelationsQueries<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>): IQueryCommand[] {
        const isColumnsEquals = (cols1: IColumnMetaData[], cols2: IColumnMetaData[]) => {
            return cols1.length === cols2.length && cols1.all(o => cols2.any(p => p.columnName === o.columnName));
        };

        const relations = schema.relations.slice(0);
        return oldSchema.relations.where(o => !relations.any(or => isColumnsEquals(o.relationColumns, or.relationColumns)))
            .selectMany(o => this.dropForeignKeyQuery(o)).toArray();
    }
    public addAllNewRelationsQueries<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>): IQueryCommand[] {
        const isColumnsEquals = (cols1: IColumnMetaData[], cols2: IColumnMetaData[]) => {
            return cols1.length === cols2.length && cols1.all(o => cols2.any(p => p.columnName === o.columnName));
        };

        const oldRelations = oldSchema.relations.slice(0);
        return schema.relations.where(o => !oldRelations.any(or => isColumnsEquals(o.relationColumns, or.relationColumns)))
            .selectMany(o => this.addForeignKeyQuery(o)).toArray();
    }
    public updateEntitySchemaQuery<T>(schema: IEntityMetaData<T>, oldSchema: IEntityMetaData<T>) {
        let result: IQueryCommand[] = [];
        const columnMetas = schema.columns.select(o => ({
            columnSchema: o,
            oldColumnSchema: oldSchema.columns.first(c => c.columnName.toLowerCase() === o.columnName.toLowerCase())
        }));

        result = columnMetas.selectMany(o => this.getColumnChangesQuery(o.columnSchema, o.oldColumnSchema)).toArray();

        const isColumnsEquals = (cols1: IColumnMetaData[], cols2: IColumnMetaData[]) => {
            return cols1.length === cols2.length && cols1.all(o => cols2.any(p => p.columnName === o.columnName));
        };
        // primary key changes
        if (!isColumnsEquals(schema.primaryKeys, oldSchema.primaryKeys)) {
            result = result.concat(this.dropPrimaryKeyQuery(oldSchema));
            result = result.concat(this.addPrimaryKeyQuery(schema));
        }

        const isConstraintEquals = (cons1: IConstraintMetaData, cons2: IConstraintMetaData) => {
            const check1 = cons1 as ICheckConstraintMetaData;
            const check2 = cons2 as ICheckConstraintMetaData;
            const checkDef1 = !check1.definition ? undefined : check1.definition instanceof FunctionExpression ? this.getExpressionString(check1.definition) : check1.definition;
            const checkDef2 = !check2.definition ? undefined : check2.definition instanceof FunctionExpression ? this.getExpressionString(check2.definition) : check2.definition;
            return checkDef1 === checkDef2 && isColumnsEquals(cons1.columns, cons2.columns);
        };
        // remove old constraint
        result = result.concat(oldSchema.constraints.where(o => !schema.constraints.any(or => isConstraintEquals(o, or)))
            .selectMany(o => this.dropConstraintQuery(o)).toArray());
        // add new constraint
        result = result.concat(schema.constraints.where(o => !oldSchema.constraints.any(or => isConstraintEquals(o, or)))
            .selectMany(o => this.addConstraintQuery(o)).toArray());

        const isIndexEquals = (index1: IIndexMetaData, index2: IIndexMetaData) => {
            return !!index1.unique === !!index2.unique && index1.type === index2.type && isColumnsEquals(index1.columns, index1.columns);
        };

        // index
        const oldIndices = oldSchema.indices.slice(0);
        const indexMap = schema.indices.select(o => ({
            index: o,
            oldIndex: oldIndices.first(c => c.name === o.name)
        }));

        // modify old index by drop and add index with newer definition
        result = result.concat(indexMap.where(o => o.oldIndex && !isIndexEquals(o.index, o.oldIndex)).selectMany(o => {
            oldIndices.remove(o.oldIndex);
            return this.dropIndexQuery(o.oldIndex).concat(this.addIndexQuery(o.index));
        }).toArray());

        // add new index
        result = result.concat(indexMap.where(o => !o.oldIndex && !oldIndices.any(oi => isIndexEquals(o.index, oi)))
            .selectMany(o => this.addIndexQuery(o.index)).toArray());

        return result;
    }
    public createEntitySchemaQuery<T>(schema: IEntityMetaData<T>): IQueryCommand[] {
        return this.createTableQuery(schema)
            .union(schema.indices.selectMany(o => this.addIndexQuery(o))).toArray();
    }
    public getColumnChangesQuery<TE>(columnSchema: IColumnMetaData<TE>, oldColumnSchema: IColumnMetaData<TE>) {
        let result: IQueryCommand[] = [];
        const entitySchema = oldColumnSchema.entity;
        // If auto increment, column must be not nullable.
        const isNullableChange = (!!columnSchema.nullable && !(columnSchema as any as NumericColumnMetaData).autoIncrement) !== (!!oldColumnSchema.nullable && !(oldColumnSchema as any as NumericColumnMetaData).autoIncrement);
        let isDefaultChange = (columnSchema.default ? this.defaultValue(columnSchema) : null) !== (oldColumnSchema.default ? this.defaultValue(oldColumnSchema) : null);
        const isIdentityChange = !!(columnSchema as any as NumericColumnMetaData).autoIncrement !== !!(oldColumnSchema as any as NumericColumnMetaData).autoIncrement;
        const isColumnChange = isNullableChange || columnSchema.columnType !== columnSchema.columnType
            || (columnSchema.collation && columnSchema.collation !== columnSchema.collation)
            || ((columnSchema as any as NumericColumnMetaData).length !== undefined && (oldColumnSchema as any as NumericColumnMetaData).length !== undefined && (columnSchema as any as NumericColumnMetaData).length !== (oldColumnSchema as any as NumericColumnMetaData).length)
            || ((columnSchema as DecimalColumnMetaData).precision !== undefined && (oldColumnSchema as DecimalColumnMetaData).precision !== undefined && (columnSchema as DecimalColumnMetaData).precision !== (oldColumnSchema as DecimalColumnMetaData).precision)
            || ((columnSchema as DecimalColumnMetaData).scale !== undefined && (oldColumnSchema as DecimalColumnMetaData).scale !== undefined && (columnSchema as DecimalColumnMetaData).scale !== (oldColumnSchema as DecimalColumnMetaData).scale);

        if (isDefaultChange && oldColumnSchema.default) {
            result = result.concat(this.dropDefaultContraintQuery(oldColumnSchema));
        }
        if (isNullableChange) {
            if (!columnSchema.nullable && !(oldColumnSchema as any as NumericColumnMetaData).autoIncrement) {
                // if change from nullable to not nullable, set all existing data to default value.
                const fallbackValue = this.defaultValue(columnSchema);
                result.push({
                    query: `UPDATE ${this.entityName(entitySchema)} SET ${this.enclose(columnSchema.columnName)} = ${fallbackValue} WHERE ${this.enclose(columnSchema.columnName)} IS NULL`
                });
            }
        }
        if (isIdentityChange) {
            const toAutoIncrement = (columnSchema as any as NumericColumnMetaData).autoIncrement;
            // add new column.
            const newName = "NEW_" + columnSchema.columnName;
            const cloneColumn = Object.assign({}, columnSchema);
            cloneColumn.columnName = newName;
            cloneColumn.entity = oldColumnSchema.entity;

            result = result.concat(this.addColumnQuery(cloneColumn));

            // turn on identity insert coz rebuild schema most likely called because identity insert issue.
            if (toAutoIncrement) {
                result.push({
                    query: `SET IDENTITY_INSERT ${this.entityName(entitySchema)} ON`
                });
            }
            // compilation will failed without exec
            result.push({
                query: `EXEC('UPDATE ${this.entityName(entitySchema)} WITH (HOLDLOCK TABLOCKX) SET ${this.enclose(cloneColumn.columnName)} = ${this.enclose(oldColumnSchema.columnName)}')`
            });
            if (toAutoIncrement) {
                result.push({
                    query: `SET IDENTITY_INSERT ${this.entityName(entitySchema)} OFF`
                });
            }

            // remove old column
            result = result.concat(this.dropColumnQuery(oldColumnSchema));
            // rename temp column
            result = result.concat(this.renameColumnQuery(cloneColumn, columnSchema.columnName));
        }
        else if (isColumnChange) {
            result = result.concat(this.alterColumnQuery(columnSchema));
        }
        if (isDefaultChange && columnSchema.default) {
            result = result.concat(this.addDefaultContraintQuery(columnSchema));
        }

        return result;
    }
    public createTableQuery<TE>(entityMetaData: IEntityMetaData<TE>): IQueryCommand[] {
        const columnDefinitions = entityMetaData.columns.select(o => this.columnDeclaration(o, "create")).toArray().join("," + this.newLine(this.indent + 1));
        const constraints = (entityMetaData.constraints || []).select(o => this.constraintDeclaration(o)).toArray().join("," + this.newLine(this.indent + 1));
        let query = `CREATE TABLE ${this.entityName(entityMetaData)}` +
            `${this.newLine()}(` +
            `${this.newLine(this.indent + 1)}${columnDefinitions}` +
            `,${this.newLine(this.indent + 1)}${this.primaryKeyDeclaration(entityMetaData)}` +
            (constraints ? `,${this.newLine(this.indent + 1)}${constraints}` : "") +
            `${this.newLine()})`;
        return [{ query }];
    }
    public renameTableQuery<TE>(entityMetaData: IEntityMetaData<TE>, newName: string): IQueryCommand[] {
        let query = `EXEC sp_rename '${this.entityName(entityMetaData)}', '${this.enclose(newName)}', 'OBJECT'`;
        return [{ query }];
    }
    public columnDeclaration(column: IColumnMetaData | IColumnExpression, type: "alter" | "create" | "add" = "alter") {
        let result = `${this.enclose(column.columnName)} ${this.getColumnType(column)}`;
        if (column instanceof ColumnExpression && column.columnMetaData) {
            column = column.columnMetaData;
        }
        if ((column as IColumnExpression).isPrimary === undefined) {
            const columnMetaData = column as IColumnMetaData;
            if (type !== "alter") {
                if (columnMetaData.default) {
                    result += ` DEFAULT ${this.defaultValue(columnMetaData)}`;
                }
            }
            if (columnMetaData.collation)
                result += " COLLATE " + columnMetaData.collation;
            if (columnMetaData.nullable === false)
                result += " NOT NULL";
            if (type !== "alter") {
                if ((columnMetaData as NumericColumnMetaData).autoIncrement)
                    result += " IDENTITY(1,1)";
            }
            if (type === "create") {
                if (columnMetaData.description)
                    result += " COMMENT " + this.getString(columnMetaData.description);
            }
        }
        return result;
    }
    public addColumnQuery(columnMeta: IColumnMetaData): IQueryCommand[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)} ADD ${this.columnDeclaration(columnMeta, "add")}`;
        return [{ query }];
    }
    public renameColumnQuery(columnMeta: IColumnMetaData, newName: string): IQueryCommand[] {
        let query = `EXEC sp_rename '${this.entityName(columnMeta.entity)}.${this.enclose(columnMeta.columnName)}', '${newName}', 'COLUMN'`;
        return [{ query }];
    }
    public alterColumnQuery(columnMeta: IColumnMetaData): IQueryCommand[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)} ALTER COLUMN ${this.columnDeclaration(columnMeta, "alter")}`;
        return [{ query }];
    }
    public dropColumnQuery(columnMeta: IColumnMetaData): IQueryCommand[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)} DROP COLUMN ${this.enclose(columnMeta.columnName)}`;
        return [{ query }];
    }
    public addDefaultContraintQuery(columnMeta: IColumnMetaData): IQueryCommand[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)} ALTER COLUMN ${this.enclose(columnMeta.columnName)}` +
            ` SET DEFAULT ${this.defaultValue(columnMeta)}`;
        return [{ query }];
    }
    public dropDefaultContraintQuery(columnMeta: IColumnMetaData): IQueryCommand[] {
        let query = `ALTER TABLE ${this.entityName(columnMeta.entity)} ALTER COLUMN ${this.enclose(columnMeta.columnName)}` +
            ` DROP DEFAULT`;
        return [{ query }];
    }
    public constraintDeclaration(constraintMeta: IConstraintMetaData) {
        let result = "";
        if ((constraintMeta as ICheckConstraintMetaData).definition) {
            const checkConstriant = constraintMeta as ICheckConstraintMetaData;
            const definition = checkConstriant.definition instanceof FunctionExpression ? this.getExpressionString(checkConstriant.definition) : checkConstriant.definition;
            result = `CONSTRAINT ${this.enclose(constraintMeta.name)} CHECK (${definition})`;
        }
        else {
            const columns = constraintMeta.columns.select(o => this.enclose(o.columnName)).toArray().join(",");
            result = `CONSTRAINT ${this.enclose(constraintMeta.name)} UNIQUE (${columns})`;
        }
        return result;
    }
    public primaryKeyDeclaration(entityMeta: IEntityMetaData) {
        const pkName = "PK_" + entityMeta.name;
        const columnQuery = entityMeta.primaryKeys.select(o => this.enclose(o.columnName)).toArray().join(",");

        return `CONSTRAINT ${this.enclose(pkName)} PRIMARY KEY (${columnQuery})`;
    }
    public foreignKeyDeclaration(relationMeta: IRelationMetaData) {
        const columns = relationMeta.relationColumns.select(o => this.enclose(o.columnName)).toArray().join(", ");
        const referenceColumns = relationMeta.reverseRelation.relationColumns.select(o => this.enclose(o.columnName)).toArray().join(", ");
        return `CONSTRAINT ${this.enclose(relationMeta.fullName)}` +
            ` FOREIGN KEY (${columns})` +
            ` REFERENCES ${this.entityName(relationMeta.target)} (${referenceColumns})` +
            ` ON UPDATE ${relationMeta.updateOption} ON DELETE ${relationMeta.deleteOption}`;
    }
    public dropTableQuery(entityMeta: IEntityMetaData<any>): IQueryCommand[] {
        const query = `DROP TABLE ${this.entityName(entityMeta)}`;
        return [{ query }];
    }
    public defaultValue(columnMeta: IColumnMetaData) {
        if (columnMeta.default) {
            return this.getExpressionString(columnMeta.default.body);
        }
        const groupType = this.supportedColumnTypes.get(columnMeta.columnType);
        if (groupType === "Numeric" || groupType === "Decimal" || columnMeta instanceof NumericColumnMetaData || columnMeta instanceof DecimalColumnMetaData)
            return this.getValueString(0);
        if (groupType === "Identifier" || columnMeta instanceof IdentifierColumnMetaData)
            return "NEWID()";
        if (groupType === "String" || groupType === "DataString" || columnMeta instanceof StringColumnMetaData || columnMeta instanceof StringDataColumnMetaData)
            return this.getValueString("");
        if (groupType === "Date" || columnMeta instanceof DateColumnMetaData)
            return "GETUTCDATE()";
        if (groupType === "Time" || columnMeta instanceof TimeColumnMetaData)
            return "CONVERT(TIME, GETUTCDATE())";

        throw new Error(`${columnMeta.columnType} not supported`);
    }
    public foreignKeyQuery(relationMeta: IRelationMetaData) {
        return `ALTER TABLE ${this.entityName(relationMeta.target)} ADD CONSTRAINT ${this.enclose(relationMeta.fullName)} FOREIGN KEY` +
            ` (${relationMeta.reverseRelation.relationColumns.select(r => this.enclose(r.columnName)).toArray().join(",")})` +
            ` REFERENCES ${this.entityName(relationMeta.source)} (${relationMeta.relationColumns.select(r => r.columnName).toArray().join(",")})` +
            ` ON UPDATE ${relationMeta.updateOption} ON DELETE ${relationMeta.deleteOption}`;
    }
    public dropForeignKeyQuery(relationMeta: IRelationMetaData): IQueryCommand[] {
        const query = `ALTER TABLE ${this.entityName(relationMeta.source)} DROP CONSTRAINT ${this.enclose(relationMeta.fullName)}`;
        return [{ query }];
    }
    public addForeignKeyQuery(relationMeta: IRelationMetaData): IQueryCommand[] {
        const query = `ALTER TABLE ${this.entityName(relationMeta.source)} ADD ${this.foreignKeyDeclaration(relationMeta)}`;
        return [{ query }];
    }
    public addConstraintQuery(constraintMeta: IConstraintMetaData): IQueryCommand[] {
        let query = `ALTER TABLE ${this.entityName(constraintMeta.entity)}` +
            ` ADD CONSTRAINT ${this.constraintDeclaration(constraintMeta)}`;
        return [{ query }];
    }
    public dropConstraintQuery(constraintMeta: IConstraintMetaData): IQueryCommand[] {
        const query = `ALTER TABLE ${this.entityName(constraintMeta.entity)} DROP CONSTRAINT ${this.enclose(constraintMeta.name)}`;
        return [{ query }];
    }
    public dropAllMasterRelationsQuery(entityMeta: IEntityMetaData): IQueryCommand[] {
        return entityMeta.relations.where(o => o.isMaster)
            .selectMany(o => this.dropForeignKeyQuery(o.reverseRelation)).toArray();
    }
    public addAllMasterRelationsQuery(entityMeta: IEntityMetaData): IQueryCommand[] {
        return entityMeta.relations.where(o => o.isMaster)
            .selectMany(o => this.addForeignKeyQuery(o.reverseRelation)).toArray();
    }
    public dropPrimaryKeyQuery(entityMeta: IEntityMetaData): IQueryCommand[] {
        const pkName = "PK_" + entityMeta.name;
        const query = `ALTER TABLE ${this.entityName(entityMeta)} DROP CONSTRAINT ${this.enclose(pkName)}`;
        return [{ query }];
    }
    public addPrimaryKeyQuery(entityMeta: IEntityMetaData): IQueryCommand[] {
        const query = `ALTER TABLE ${this.entityName(entityMeta)} ADD ${this.primaryKeyDeclaration(entityMeta)}`;
        return [{ query }];
    }
    public addIndexQuery(indexMeta: IIndexMetaData): IQueryCommand[] {
        const columns = indexMeta.columns.select(o => this.enclose(o.columnName)).toArray().join(",");
        const query = `CREATE${indexMeta.unique ? " UNIQUE" : ""} INDEX ${indexMeta.name} ON ${this.entityName(indexMeta.entity)} (${columns})`;
        return [{ query }];
    }
    public dropIndexQuery(indexMeta: IIndexMetaData): IQueryCommand[] {
        const query = `DROP INDEX ${indexMeta.name}`;
        return [{ query }];
    }
}
