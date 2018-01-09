import { IObjectType, orderDirection, RelationType } from "../Common/Type";
import { entityMetaKey, relationMetaKey } from "../Decorator/DecoratorKey";
import {
    AdditionExpression, AndExpression, ArrayValueExpression, BitwiseAndExpression,
    BitwiseNotExpression, BitwiseOrExpression, BitwiseSignedRightShiftExpression,
    BitwiseXorExpression, BitwiseZeroLeftShiftExpression, BitwiseZeroRightShiftExpression,
    DivisionExpression, EqualExpression, FunctionCallExpression, FunctionExpression,
    GreaterEqualExpression, GreaterThanExpression, IBinaryOperatorExpression, IExpression,
    InstanceofExpression, IUnaryOperatorExpression, LeftDecrementExpression,
    LeftIncrementExpression, LessEqualExpression, LessThanExpression, MemberAccessExpression,
    MethodCallExpression, NotEqualExpression, NotExpression, ObjectValueExpression, OrExpression,
    ParameterExpression, RightDecrementExpression, RightIncrementExpression,
    StrictEqualExpression, StrictNotEqualExpression, SubtractionExpression, TernaryExpression,
    TimesExpression, TypeofExpression, ValueExpression
} from "../ExpressionBuilder/Expression";
import { ModulusExpression } from "../ExpressionBuilder/Expression/ModulusExpression";
import { ExpressionFactory } from "../ExpressionBuilder/ExpressionFactory";
import { ExpressionTransformer } from "../ExpressionBuilder/ExpressionTransformer";
import { IEntityMetaData, IRelationMetaData } from "../MetaData/Interface/index";
import { MasterRelationMetaData } from "../MetaData/Relation/index";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "./Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "./Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "./Queryable/QueryExpression/IColumnExpression";
import { ICommandQueryExpression } from "./Queryable/QueryExpression/ICommandQueryExpression";
import { ColumnExpression, ComputedColumnExpression, IEntityExpression, ProjectionEntityExpression } from "./Queryable/QueryExpression/index";
import { JoinEntityExpression } from "./Queryable/QueryExpression/JoinTableExpression";
import { SelectExpression } from "./Queryable/QueryExpression/SelectExpression";
import { UnionExpression } from "./Queryable/QueryExpression/UnionExpression";

export abstract class QueryBuilder extends ExpressionTransformer {
    public namingStrategy: NamingStrategy = new NamingStrategy();
    private aliasObj: { [key: string]: number } = {};
    public newAlias(type: "entity" | "column" = "entity") {
        let aliasCount = this.aliasObj[type];
        if (!aliasCount)
            aliasCount = this.aliasObj[type] = 0;
        return this.namingStrategy.getAlias(type) + aliasCount++;
    }
    public escape(identity: string) {
        if (this.namingStrategy.enableEscape)
            return "[" + identity + "]";
        else
            return identity;
    }
    /**
     * Expression visitor
     */
    public visit(expression: IExpression, param: { parent: ICommandQueryExpression }): IExpression {
        switch (expression.constructor) {
            case MemberAccessExpression:
                return this.visitMember(expression as any, param);
            case MethodCallExpression:
                return this.visitMethod(expression as any, param);
            case FunctionCallExpression:
                return this.visitFunctionCall(expression as any, param);
            case BitwiseNotExpression:
            case LeftDecrementExpression:
            case LeftIncrementExpression:
            case NotExpression:
            case RightDecrementExpression:
            case RightIncrementExpression:
            case TypeofExpression:
                return this.visitUnaryOperator(expression as any as IUnaryOperatorExpression, param);
            case AdditionExpression:
            case AndExpression:
            case BitwiseAndExpression:
            case BitwiseOrExpression:
            case BitwiseSignedRightShiftExpression:
            case BitwiseXorExpression:
            case BitwiseZeroLeftShiftExpression:
            case BitwiseZeroRightShiftExpression:
            case DivisionExpression:
            case EqualExpression:
            case GreaterEqualExpression:
            case GreaterThanExpression:
            case InstanceofExpression:
            case LessEqualExpression:
            case LessThanExpression:
            case ModulusExpression:
            case NotEqualExpression:
            case OrExpression:
            case StrictEqualExpression:
            case StrictNotEqualExpression:
            case SubtractionExpression:
            case TimesExpression:
                return this.visitBinaryOperator(expression as any as IBinaryOperatorExpression, param);
            case TernaryExpression:
                return this.visitTernaryOperator(expression as TernaryExpression<any>, param);
            case ObjectValueExpression:
                return this.visitObjectLiteral(expression as ObjectValueExpression<any>, param);
            case ArrayValueExpression:
                throw new Error(`literal Array not supported`);
            // Possibly not used
            case FunctionExpression:
                return this.visitFunction(expression as FunctionExpression, param);
            case ParameterExpression:
                return expression;
        }
        return expression;
    }
    public getExpressionString<T = any>(expression: IExpression<T>): string {
        if (expression instanceof SelectExpression) {
            return this.getSelectQueryString(expression);
        }
        else if (expression instanceof ColumnExpression || expression instanceof ComputedColumnExpression) {
            return this.getColumnString(expression);
        }
        else if (expression instanceof EntityExpression || expression instanceof JoinEntityExpression || expression instanceof ProjectionEntityExpression) {
            return this.getEntityQueryString(expression);
        }
        else {
            let result = "";
            switch (expression.constructor) {
                case MemberAccessExpression:
                    result = this.getMemberAccessExpressionString(expression as any);
                    break;
                case MethodCallExpression:
                    result = this.getMethodCallExpressionString(expression as any);
                    break;
                case FunctionCallExpression:
                    result = this.getFunctionCallExpressionString(expression as any);
                    break;
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
                case TimesExpression:
                    result = this.getTimesExpressionString(expression as any);
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
            return "(" + result + ")";
        }
    }
    protected getColumnString(column: IColumnExpression) {
        return this.escape(column.entity.alias) + "." + this.escape(column.alias ? column.alias : column.property);
    }
    protected getSelectQueryString(select: SelectExpression): string {
        let result = "";
        if (select instanceof UnionExpression) {
            result += this.getSelectQueryString(select.entity.select) +
                " UNION" + (select.isUnionAll ? " ALL" : "") +
                " " + this.getSelectQueryString(select.entity2.select) +
                (select.where ? " WHERE " + select.where.toString(this) : "") +
                (select.orders.length > 0 ? " ORDER BY " + select.orders.select((c) => this.getExpressionString(c.column) + " " + c.direction).toArray().join(", ") : "");
        }
        else {
            result += "SELECT " + (select.distinct ? " DISTINCT" : "") + " " + (select.paging.take && select.paging.take > 0 ? "TOP " + select.paging.take : "") + " " +
                select.columns.select((o) => o.toString(this)).toArray().join(", ") +
                " FROM " + this.getEntityQueryString(select.entity) +
                (select.where ? " WHERE " + select.where.toString(this) : "") +
                ((select instanceof GroupByExpression) && select.groupBy ? " GROUP BY " + select.groupBy.select((o) => o.toString(this)).toArray().join(", ") : "") +
                (select.orders.length > 0 ? " ORDER BY " + select.orders.select((c) => this.getExpressionString(c.column) + " " + c.direction).toArray().join(", ") : "");
        }
        return result;
    }
    protected getEntityQueryString(entity: IEntityExpression): string {
        if (entity instanceof ProjectionEntityExpression)
            return "(" + this.getSelectQueryString(entity.select) + ") AS " + this.escape(entity.alias);
        else if (entity instanceof JoinEntityExpression)
            return "(" + this.getEntityQueryString(entity.leftEntity) + ") " + entity.joinType + " JOIN (" + this.getEntityQueryString(entity.rightEntity) + ")" +
                "ON " + entity.relations.select((r) => this.getColumnString(r.leftColumn) + "=" + this.getColumnString(r.rightColumn)).join(" AND ");
        return this.escape(entity.name) + (entity.alias ? " AS " + this.escape(entity.alias) : "");
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
        const fnExpression = ExpressionFactory.prototype.ToExpression(expression.functionFn, expression.params[0].type);
        for (let i = 0; i < fnExpression.params.length; i++) {
            const param = fnExpression.params[i];
            this.parameters.add(param.name, expression.params[i]);
        }
        const result = this.getExpressionString(fnExpression.body);
        return result;
    }
    protected getMemberAccessExpressionString(expression: MemberAccessExpression<any, any>): string {
        switch (expression.objectOperand.type) {
            case String:
                switch (expression.memberName) {
                    case "length":
                        return "LEN(" + this.getExpressionString(expression.objectOperand) + ")";
                }
                break;
            case Object:
                if (expression instanceof ValueExpression) {
                    switch (expression.value) {
                        case Math:
                            switch (expression.memberName) {
                                case "E":
                                    return "EXP(1)";
                                case "LN10":
                                    return "LOG(10)";
                                case "LN2":
                                    return "LOG(2)";
                                case "LOG10E":
                                    return "LOG10(EXP(1))";
                                case "LOG2E":
                                    return "LOG(EXP(1), 2)";
                                case "PI":
                                    return "PI()";
                                case "SQRT1_2":
                                    return "SQRT(0.5)";
                                case "SQRT2":
                                    return "SQRT(2)";
                            }
                            break;
                    }
                }
                break;
        }
        throw new Error(`${expression.memberName} not supported.`);
    }
    protected getMethodCallExpressionString<TType, KProp extends keyof TType, TResult = any>(expression: MethodCallExpression<TType, KProp, TResult>): string {
        switch (expression.objectOperand.type as any) {
            case String:
                switch (expression.methodName) {
                    case "charAt":
                        return "SUBSTRING(" + this.getExpressionString(expression.objectOperand) + ", " + this.getExpressionString(expression.params[0]) + ", 1)";
                    case "charCodeAt":
                        return "UNICODE(SUBSTRING(" + this.getExpressionString(expression.objectOperand) + ", " + this.getExpressionString(expression.params[0]) + ", 1))";
                    case "concat":
                        return "CONCAT(" + this.getExpressionString(expression.objectOperand) + ", " + expression.params.select((p) => this.getExpressionString(p)).toArray().join(", ") + ")";
                    case "endsWith":
                        return "(" + this.getExpressionString(expression.objectOperand) + " LIKE CONCAT(" + this.getString("%") + ", " + this.getExpressionString(expression.params[0]) + "))";
                    case "includes":
                        if (expression.params.length > 1)
                            return "(" + this.getExpressionString(expression.params[0]) + " + RIGHT(" + this.getExpressionString(expression.objectOperand) + ", (LEN(" + this.getExpressionString(expression.objectOperand) + ") - " + this.getExpressionString(expression.params[0]) + "))))";
                        return "(" + this.getExpressionString(expression.objectOperand) + " LIKE CONCAT(" + this.getString("%") + ", " + this.getExpressionString(expression.params[0]) + ", " + this.getString("%") + ")";
                    case "indexOf":
                        return "(CHARINDEX(" + this.getExpressionString(expression.params[0]) + ", " + this.getExpressionString(expression.objectOperand) +
                            (expression.params.length > 1 ? ", " + this.getExpressionString(expression.params[1]) : "") +
                            ") - 1)";
                    case "lastIndexOf":
                        return "(LEN(" + this.getExpressionString(expression.objectOperand) + ") - CHARINDEX(" + this.getExpressionString(expression.params[0]) + ", REVERSE(" + this.getExpressionString(expression.objectOperand) + ")" +
                            (expression.params.length > 1 ? ", " + this.getExpressionString(expression.params[1]) : "") + "))";
                    case "like":
                        return "(" + this.getExpressionString(expression.objectOperand) + " LIKE " + this.getExpressionString(expression.params[0]) + ")";
                    case "repeat":
                        return "REPLICATE(" + this.getExpressionString(expression.objectOperand) + ", " + this.getExpressionString(expression.params[0]) + ")";
                    case "replace":
                        // TODO throw error on regex.
                        return "REPLACE(" + this.getExpressionString(expression.objectOperand) + ", " + this.getExpressionString(expression.params[0]) + ", " + this.getExpressionString(expression.params[1]) + ")";
                    case "split":
                        // only single character split.
                        return "STRING_SPLIT(" + this.getExpressionString(expression.objectOperand) + ", " + this.getExpressionString(expression.params[0]) + ")";
                    case "startsWith":
                        return "(" + this.getExpressionString(expression.objectOperand) + " LIKE CONCAT(" + this.getExpressionString(expression.params[0]) + ", " + this.getString("%") + "))";
                    case "substr":
                        return "SUBSTRING(" + this.getExpressionString(expression.objectOperand) + ", " +
                            "(" + this.getExpressionString(expression.params[0]) + " + 1), " +
                            (expression.params.length > 1 ? this.getExpressionString(expression.params[1]) : "8000") + ")";
                    case "substring":
                        return "SUBSTRING(" + this.getExpressionString(expression.objectOperand) + ", " +
                            "(" + this.getExpressionString(expression.params[0]) + " + 1), " +
                            (expression.params.length > 1 ? "(" + this.getExpressionString(expression.params[1]) + " - " + this.getExpressionString(expression.params[0]) + ")" : "8000") + ")";
                    case "toLowerCase":
                    case "toLocaleLowerCase":
                        return "LOWER(" + this.getExpressionString(expression.objectOperand) + ")";
                    case "toUpperCase":
                    case "toLocaleUpperCase":
                        return "UPPER(" + this.getExpressionString(expression.objectOperand) + ")";
                    case "toString":
                    case "valueOf":
                        return this.getExpressionString(expression.objectOperand);
                    case "trim":
                        return "RTRIM(LTRIM(" + this.getExpressionString(expression.objectOperand) + "))";
                    case "localeCompare":
                    case "match":
                    case "normalize":
                    case "padEnd":
                    case "padStart":
                    case "search":
                    case "slice":
                        throw new Error(`method "String.${expression.methodName}" not supported in linq to sql.`);
                }
                break;
            case Number:
                switch (expression.methodName) {
                    case "isFinite":
                    case "isInteger":
                    case "isNaN":
                    case "isSafeInteger":
                    case "toExponential":
                    case "toFixed":
                    case "toPrecision":
                    case "toString":
                    case "valueOf":
                        break;

                }
                break;
            case Symbol:
                switch (expression.methodName) {
                    case "toString":
                        break;
                }
                break;
            case Boolean:
                switch (expression.methodName) {
                    case "toString":
                        return "(CASE WHEN (" + this.getExpressionString(expression.objectOperand) + ") THEN " + this.getString("true") + " ELSE " + this.getString("false") + " END)";
                }
                break;
            case Date:
                switch (expression.methodName) {
                    case "getDate":
                        return "DAY(" + this.getExpressionString(expression.objectOperand) + ")";
                    case "getDay":
                        return "(DATEPART(weekday, " + this.getExpressionString(expression.objectOperand) + ") - 1)";
                    case "getFullYear":
                        return "YEAR(" + this.getExpressionString(expression.objectOperand) + ")";
                    case "getHours":
                        return "DATEPART(hour, " + this.getExpressionString(expression.objectOperand) + ")";
                    case "getMinutes":
                        return "DATEPART(minute, " + this.getExpressionString(expression.objectOperand) + ")";
                    case "getMonth":
                        return "(MONTH(" + this.getExpressionString(expression.objectOperand) + ") - 1)";
                    case "getSeconds":
                        return "DATEPART(second, " + this.getExpressionString(expression.objectOperand) + ")";
                    case "getMilliseconds":
                        return "DATEPART(millisecond, " + this.getExpressionString(expression.objectOperand) + ")";
                    case "getTime":
                    case "getTimezoneOffset":
                    case "getUTCDate":
                    case "getUTCDay":
                    case "getUTCFullYear":
                    case "getUTCHours":
                    case "getUTCMilliseconds":
                    case "getUTCMinutes":
                    case "getUTCMonth":
                    case "getUTCSeconds":
                        throw new Error(`${expression.methodName} not supported.`);
                    case "getYear":
                        throw new Error(`${expression.methodName} deprecated.`);
                    case "setDate":
                        return "DATEADD(DAY, (" + this.getExpressionString(expression.params[0]) + " - DAY(" + this.getExpressionString(expression.objectOperand) + ")), " + this.getExpressionString(expression.objectOperand) + ")";
                    case "setFullYear":
                        return "DATEADD(YYYY, (" + this.getExpressionString(expression.params[0]) + " - YEAR(" + this.getExpressionString(expression.objectOperand) + ")), " + this.getExpressionString(expression.objectOperand) + ")";
                    case "setHours":
                        return "DATEADD(HH, (" + this.getExpressionString(expression.params[0]) + " - DATEPART(hour, " + this.getExpressionString(expression.objectOperand) + ")), " + this.getExpressionString(expression.objectOperand) + ")";
                    case "setMilliseconds":
                        return "DATEADD(MS, (" + this.getExpressionString(expression.params[0]) + " - DATEPART(millisecond, " + this.getExpressionString(expression.objectOperand) + ")), " + this.getExpressionString(expression.objectOperand) + ")";
                    case "setMinutes":
                        return "DATEADD(MI, (" + this.getExpressionString(expression.params[0]) + " - DATEPART(minute, " + this.getExpressionString(expression.objectOperand) + ")), " + this.getExpressionString(expression.objectOperand) + ")";
                    case "setMonth":
                        return "DATEADD(MM, (" + this.getExpressionString(expression.params[0]) + " - (MONTH(" + this.getExpressionString(expression.objectOperand) + ") - 1)), " + this.getExpressionString(expression.objectOperand) + ")";
                    case "setSeconds":
                        return "DATEADD(SS, (" + this.getExpressionString(expression.params[0]) + " - DATEPART(second, " + this.getExpressionString(expression.objectOperand) + ")), " + this.getExpressionString(expression.objectOperand) + ")";
                    case "setTime":
                    case "setUTCDate":
                    case "setUTCFullYear":
                    case "setUTCHours":
                    case "setUTCMilliseconds":
                    case "setUTCMinutes":
                    case "setUTCMonth":
                    case "setUTCSeconds":
                    case "toJSON":
                    case "toISOString":
                    case "toLocaleDateString":
                    case "toLocaleTimeString":
                    case "toLocaleString":
                    case "toString":
                    case "valueOf":
                    case "toTimeString":
                    case "toUTCString":
                        throw new Error(`${expression.methodName} not supported.`);
                    case "setYear":
                        throw new Error(`${expression.methodName} deprecated.`);
                    case "toDateString":
                        return "CONCAT(LEFT(DATENAME(WEEKDAY, " + this.getExpressionString(expression.objectOperand) + "), 3), " + this.getString(" ") + ", " +
                            "LEFT(DATENAME(MONTH, " + this.getExpressionString(expression.objectOperand) + "), 3), " + this.getString(" ") + ", " +
                            "RIGHT(CONCAT(" + this.getString("0") + ", RTRIM(MONTH(" + this.getExpressionString(expression.objectOperand) + "))), 2)" + this.getString(" ") + ", " +
                            "RIGHT(CONCAT(" + this.getString("0") + ", RTRIM(MONTH(" + this.getExpressionString(expression.objectOperand) + "))), 2))";
                    case "toGMTString":
                        throw new Error(`${expression.methodName} deprecated.`);
                }
                break;
            case Object:
                if ((expression.objectOperand as IEntityExpression).columns) {
                    switch (expression.methodName) {
                        case "concat":
                        case "copyWithin":
                        case "every":
                        case "fill":
                        case "filter":
                        case "find":
                        case "findIndex":
                        case "forEach":
                        case "indexOf":
                        case "join":
                        case "lastIndexOf":
                        case "map":
                        case "pop":
                        case "push":
                        case "reduce":
                        case "reduceRight":
                        case "reverse":
                        case "shift":
                        case "slice":
                        case "some":
                        case "sort":
                        case "splice":
                        case "toString":
                        case "unshift":
                        case "valueOf":
                            break;
                    }
                }
                if (expression.objectOperand instanceof ValueExpression) {
                    switch (expression.objectOperand.value) {
                        case Date:
                            switch (expression.methodName) {
                                case "UTC":
                                case "now":
                                case "parse":
                                    throw new Error(`Date.${expression.methodName} not supported.`);
                            }
                            break;
                        case Math:
                            switch (expression.methodName) {
                                case "abs":
                                case "acos":
                                case "asin":
                                case "atan":
                                case "cos":
                                case "exp":
                                case "sin":
                                case "sqrt":
                                case "tan":
                                case "floor":
                                case "log":
                                case "log10":
                                case "sign":
                                    return expression.methodName.toUpperCase() + "(" + this.getExpressionString(expression.params[0]) + ")";
                                case "ceil":
                                    return "CEILING(" + this.getExpressionString(expression.params[0]) + ")";
                                case "atan2":
                                    return "ATN2(" + this.getExpressionString(expression.params[0]) + "," + this.getExpressionString(expression.params[1]) + ")";
                                case "pow":
                                    return "POWER(" + this.getExpressionString(expression.params[0]) + "," + this.getExpressionString(expression.params[1]) + ")";
                                case "random":
                                    return "RAND()";
                                case "round":
                                    return "ROUND(" + this.getExpressionString(expression.params[0]) + ", 0)";
                                case "expm1":
                                    return "(EXP(" + this.getExpressionString(expression.params[0]) + ") - 1)";
                                case "hypot":
                                    return "SQRT(" + expression.params.select((p) => "POWER(" + this.getExpressionString(p) + ", 2)").toArray().join(" + ") + ")";
                                case "log1p":
                                    return "LOG(1 + " + this.getExpressionString(expression.params[0]) + ")";
                                case "log2":
                                    return "LOG(" + this.getExpressionString(expression.params[0]) + ", 2)";
                                case "sinh":
                                    return "((EXP(" + this.getExpressionString(expression.params[0]) + ") - EXP(-" + this.getExpressionString(expression.params[0]) + ")) / 2)";
                                case "cosh":
                                    return "((EXP(" + this.getExpressionString(expression.params[0]) + ") + EXP(-" + this.getExpressionString(expression.params[0]) + ")) / 2)";
                                case "tanh":
                                    return "((EXP(2 * " + this.getExpressionString(expression.params[0]) + ") - 1) / (EXP(2 * " + this.getExpressionString(expression.params[0]) + ") + 1))";
                                case "trunc":
                                    return "(" + this.getExpressionString(expression.params[0]) + " | 0)";
                                case "max":
                                case "min":
                                case "acosh":
                                case "asinh":
                                case "atanh":
                                case "cbrt":
                                case "clz32":
                                case "fround":
                                case "imul":
                                    throw new Error(`method "Math.${expression.methodName}" not supported in linq to sql.`);
                            }
                            break;
                        case Array:
                            switch (expression.methodName) {
                                case "isArray":
                                    break;
                            }
                            break;
                    }
                }
                break;
            case Function:
                switch (expression.methodName) {
                    case "apply":
                    case "bind":
                    case "call":
                    case "toSource":
                    case "toString":
                        break;
                }
                break;
        }
        const methodFn = expression.objectOperand.type.prototype[expression.methodName];
        if (methodFn) {
            // TODO: ToExpression must support this parameter
            const fnExpression = ExpressionFactory.prototype.ToExpression(methodFn, expression.objectOperand.type);
            for (let i = 0; i < fnExpression.params.length; i++) {
                const param = fnExpression.params[i];
                this.parameters.add(param.name, expression.params[i]);
            }
            this.parameters.add("this", expression.objectOperand);
            const result = this.getExpressionString(fnExpression.body);
            return result;
        }
        throw new Error(`type ${expression.objectOperand.type.name} not supported in linq to sql.`);
    }
    protected getParameterExpressionString(expression: ParameterExpression): string {
        return this.getValueString(this.parameters.get(expression.name));
    }
    protected getValueExpressionString(expression: ValueExpression<any>): string {
        return this.getValueString(expression.value);
    }
    protected getValueString(value: any): string {
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
        return this.getString(value.getFullYear() + "-" + this.fillZero(value.getMonth() + 1) + "-" + this.fillZero(value.getDate()) + " " +
            this.fillZero(value.getHours()) + ":" + this.fillZero(value.getMinutes()) + ":" + this.fillZero(value.getSeconds()));
    }
    protected getNullString() {
        return "NULL";
    }
    protected getString(value: string) {
        return "'" + value + "'";
    }
    protected getBooleanString(value: boolean) {
        return value ? "1" : "0";
    }
    protected getNumberString(value: number) {
        return value.toString();
    }
    // tslint:disable-next-line:variable-name
    protected getFunctionExpressionString<T>(_expression: FunctionExpression<T>): string {
        throw new Error(`Function not supported`);
    }

    protected getTernaryExpressionString<T>(expression: TernaryExpression<T>): string {
        return "CASE WHEN (" + this.getExpressionString(expression.logicalOperand) + ") THEN " + this.getExpressionString(expression.trueResultOperand) + " ELSE " + this.getExpressionString(expression.falseResultOperand) + " END";
    }
    // tslint:disable-next-line:variable-name
    protected getObjectValueExpressionString<T extends { [Key: string]: IExpression }>(_expression: ObjectValueExpression<T>): string {
        throw new Error(`ObjectValue not supported`);
    }
    // tslint:disable-next-line:variable-name
    protected getArrayValueExpressionString<T>(_expression: ArrayValueExpression<T>): string {
        throw new Error(`ArrayValue not supported`);
    }

    protected getDivisionExpressionString(expression: DivisionExpression): string {
        return this.getExpressionString(expression.leftOperand) + " / " + this.getExpressionString(expression.rightOperand);
    }
    protected getEqualExpressionString(expression: EqualExpression): string {
        return this.getExpressionString(expression.leftOperand) + " = " + this.getExpressionString(expression.rightOperand);
    }
    protected getGreaterEqualExpressionString<T>(expression: GreaterEqualExpression<T>): string {
        return this.getExpressionString(expression.leftOperand) + " >= " + this.getExpressionString(expression.rightOperand);
    }
    protected getGreaterThanExpressionString<T>(expression: GreaterThanExpression<T>): string {
        return this.getExpressionString(expression.leftOperand) + " > " + this.getExpressionString(expression.rightOperand);
    }
    // tslint:disable-next-line:variable-name
    protected getInstanceofExpressionString(_expression: InstanceofExpression): string {
        throw new Error(`InstanceofExpression not supported`);
    }
    protected getLessEqualExpressionString<T>(expression: LessEqualExpression<T>): string {
        return this.getExpressionString(expression.leftOperand) + " <= " + this.getExpressionString(expression.rightOperand);
    }
    protected getLessThanExpressionString<T>(expression: LessThanExpression<T>): string {
        return this.getExpressionString(expression.leftOperand) + " < " + this.getExpressionString(expression.rightOperand);
    }
    protected getModulusExpressionString(expression: ModulusExpression): string {
        return this.getExpressionString(expression.leftOperand) + " % " + this.getExpressionString(expression.rightOperand);
    }
    protected getNotEqualExpressionString(expression: NotEqualExpression): string {
        return this.getExpressionString(expression.leftOperand) + " <> " + this.getExpressionString(expression.rightOperand);
    }
    protected getOrExpressionString(expression: OrExpression): string {
        return this.getExpressionString(expression.leftOperand) + " OR " + this.getExpressionString(expression.rightOperand);
    }
    protected getStrictEqualExpressionString<T>(expression: StrictEqualExpression<T>): string {
        return this.getEqualExpressionString(expression);
    }
    protected getStrictNotEqualExpressionString(expression: StrictNotEqualExpression): string {
        return this.getNotEqualExpressionString(expression);
    }
    protected getSubtractionExpressionString(expression: SubtractionExpression): string {
        return this.getExpressionString(expression.leftOperand) + " - " + this.getExpressionString(expression.rightOperand);
    }
    protected getTimesExpressionString(expression: TimesExpression): string {
        return this.getExpressionString(expression.leftOperand) + " * " + this.getExpressionString(expression.rightOperand);
    }

    protected getAdditionExpressionString<T extends string | number>(expression: AdditionExpression<T>): string {
        if (expression.type as any === String)
            return "CONCAT(" + this.getExpressionString(expression.leftOperand) + ", " + this.getExpressionString(expression.rightOperand) + ")";

        return this.getExpressionString(expression.leftOperand) + " + " + this.getExpressionString(expression.rightOperand);
    }
    protected getAndExpressionString(expression: AndExpression): string {
        return this.getExpressionString(expression.leftOperand) + " AND " + this.getExpressionString(expression.rightOperand);
    }
    // tslint:disable-next-line:variable-name
    protected getLeftDecrementExpressionString(_expression: LeftDecrementExpression): string {
        throw new Error(`LeftDecrement not supported`);
    }
    // tslint:disable-next-line:variable-name
    protected getLeftIncrementExpressionString(_expression: LeftIncrementExpression): string {
        throw new Error(`LeftIncrement not supported`);
    }
    protected getNotExpressionString(expression: NotExpression): string {
        const operandString = this.getExpressionString(expression.operand);
        return "NOT " + operandString;
    }
    // tslint:disable-next-line:variable-name
    protected getRightDecrementExpressionString(_expression: RightIncrementExpression): string {
        throw new Error(`RightDecrement not supported`);
    }
    // tslint:disable-next-line:variable-name
    protected getRightIncrementExpressionString(_expression: RightIncrementExpression): string {
        throw new Error(`RightIncrement not supported`);
    }
    // tslint:disable-next-line:variable-name
    protected getTypeofExpressionString(_expression: TypeofExpression): string {
        throw new Error(`Typeof not supported`);
    }

    protected getBitwiseNotExpressionString(expression: BitwiseNotExpression): string {
        const operandString = this.getExpressionString(expression.operand);
        return "~ " + operandString;
    }
    protected getBitwiseAndExpressionString(expression: BitwiseAndExpression): string {
        return this.getExpressionString(expression.leftOperand) + " & " + this.getExpressionString(expression.rightOperand);
    }
    protected getBitwiseOrExpressionString(expression: BitwiseOrExpression): string {
        return this.getExpressionString(expression.leftOperand) + " | " + this.getExpressionString(expression.rightOperand);
    }
    protected getBitwiseXorExpressionString(expression: BitwiseXorExpression): string {
        return this.getExpressionString(expression.leftOperand) + " ^ " + this.getExpressionString(expression.rightOperand);
    }
    // http://dataeducation.com/bitmask-handling-part-4-left-shift-and-right-shift/
    protected getBitwiseSignedRightShiftExpressionString(expression: BitwiseSignedRightShiftExpression): string {
        throw new Error(`BitwiseSignedRightShift not supported`);
    }
    protected getBitwiseZeroRightShiftExpressionString(expression: BitwiseZeroRightShiftExpression): string {
        throw new Error(`BitwiseSignedRightShift not supported`);
    }
    protected getBitwiseZeroLeftShiftExpressionString(expression: BitwiseZeroLeftShiftExpression): string {
        throw new Error(`BitwiseSignedRightShift not supported`);
    }
    protected visitFunction<T, TR>(expression: FunctionExpression<T, TR>, param: { parent: ICommandQueryExpression }) {
        return this.visit(expression.body, param);
    }
    protected visitMember<TType, KProp extends keyof TType>(expression: MemberAccessExpression<TType, KProp>, param: { parent: ICommandQueryExpression }): IExpression {
        const res = expression.objectOperand = this.visit(expression.objectOperand, param);
        if (expression.memberName === "prototype" || expression.memberName === "__proto__")
            throw new Error(`property ${expression.memberName} not supported in linq to sql.`);

        if ((res as IEntityExpression).columns && expression.memberName === "length") {
            return new ComputedColumnExpression(res as IEntityExpression, new MethodCallExpression(res, "count", []));
        }
        switch (res.type) {
            case String:
                switch (expression.memberName) {
                    case "length":
                        return expression;
                }
                break;
            case Function:
                switch (expression.memberName) {
                    case "arguments":
                    case "caller":
                    case "length":
                    case "name":
                    case "prototype":
                        break;
                }
                break;
        }
        if ((res instanceof ValueExpression)) {
            switch (res.value) {
                case Number:
                    switch (expression.memberName) {
                        case "MAX_VALUE":
                        case "MIN_VALUE":
                        case "NEGATIVE_INFINITY":
                        case "NaN":
                        case "POSITIVE_INFINITY":
                        case "constructor":
                        case "prototype":
                            break;
                    }
                    break;
            }
        }
        const parentEntity = res as IEntityExpression;
        const relationMeta: IRelationMetaData<any, any> = Reflect.getOwnMetadata(relationMetaKey, res.type, expression.memberName as string);
        if (relationMeta) {
            const targetType = relationMeta instanceof MasterRelationMetaData ? relationMeta.slaveType! : relationMeta.masterType!;
            if (!parentEntity.has(targetType as IObjectType<any>)) {
                const joinEntity = new JoinEntityExpression(parentEntity, new EntityExpression(targetType, this.newAlias()), this.newAlias(), relationMeta.relationType === RelationType.OneToMany ? "LEFT" : "INNER");
                joinEntity.relations = Object.keys(relationMeta.relationMaps!).select((o) => ({
                    leftColumn: joinEntity.leftEntity.columns.first((c) => c.property === o),
                    rightColumn: joinEntity.rightEntity.columns.first((c) => c.property === relationMeta.relationMaps![o])
                })).toArray();
                param.parent.replaceEntity(parentEntity, joinEntity);
                return joinEntity.rightEntity;
            }
            return parentEntity.get(targetType);
        }
        if (parentEntity) {
            const column = parentEntity.columns.first((c) => c.property === expression.memberName);
            if (column)
                return column;
        }
        throw new Error(`property ${expression.memberName} not supported in linq to sql.`);
    }
    protected visitMethod<TType, KProp extends keyof TType, TResult = any>(expression: MethodCallExpression<TType, KProp, TResult>, param: { parent: ICommandQueryExpression }): IExpression {
        expression.objectOperand = this.visit(expression.objectOperand, param);
        if ((expression.objectOperand as IEntityExpression).columns) {
            const parentEntity = expression.objectOperand as IEntityExpression;
            switch (expression.methodName) {
                case "where":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        const fnExpression = expression.params[0] as FunctionExpression<TType, boolean>;
                        this.parameters.add(fnExpression.params[0].name, parentEntity.type);
                        const resExpression = this.visit(fnExpression, { parent: projectionEntity.select });
                        let whereExpression: IExpression<boolean>;
                        if (resExpression.type === Boolean) {
                            whereExpression = resExpression as any;
                        }
                        else if ((resExpression as IEntityExpression).columns) {
                            whereExpression = new ValueExpression(true);
                        }
                        else if (resExpression.type === Number) {
                            whereExpression = new OrExpression(new NotEqualExpression(resExpression, new ValueExpression(0)), new NotEqualExpression(resExpression, new ValueExpression(null)));
                        }
                        else if (resExpression.type === String) {
                            whereExpression = new OrExpression(new NotEqualExpression(resExpression, new ValueExpression("")), new NotEqualExpression(resExpression, new ValueExpression(null)));
                        }
                        else {
                            whereExpression = new NotEqualExpression(resExpression, new ValueExpression(null));
                        }
                        this.parameters.remove(fnExpression.params[0].name);
                        projectionEntity.select.where = projectionEntity.select.where ? new AndExpression(projectionEntity.select.where, whereExpression!) : whereExpression!;
                        return projectionEntity;
                    }
                case "select":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        let selectExp = projectionEntity.select;
                        const fnExpression = expression.params[0] as FunctionExpression<TType, TResult>;
                        this.parameters.add(fnExpression.params[0].name, projectionEntity.type);
                        const selectExpression = this.visit(fnExpression, { parent: projectionEntity.select });
                        this.parameters.remove(fnExpression.params[0].name);

                        selectExp.columns = [];
                        if ((selectExpression as IEntityExpression).columns) {
                            if (!selectExp.where) {
                                const entityExpression = selectExpression as IEntityExpression;
                                selectExp = projectionEntity.select = new SelectExpression(entityExpression);
                            }
                        }
                        else if ((selectExpression as IColumnExpression).entity) {
                            const columnExpression = selectExpression as IColumnExpression;
                            if (!selectExp.where)
                                selectExp = projectionEntity.select = new SelectExpression(columnExpression.entity);
                            selectExp.columns.add(columnExpression);
                            return columnExpression.entity;
                        }
                        else if (selectExpression instanceof ObjectValueExpression) {
                            selectExp.columns = Object.keys(selectExpression.object).select(
                                (o) => selectExpression.object[o] instanceof ColumnExpression ? selectExpression.object[o] : new ComputedColumnExpression(selectExp.entity, selectExpression.object[o], this.newAlias("column"))
                            ).toArray();
                        }
                        else {
                            const columnExpression = new ComputedColumnExpression(projectionEntity, selectExpression, this.newAlias("column"));
                            selectExp.columns.add(columnExpression);
                        }
                        return projectionEntity;
                    }
                case "distinct":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        const selectExp = projectionEntity.select;
                        if (expression.params.length > 0) {
                            projectionEntity = this.visit(new MethodCallExpression(projectionEntity, "groupBy", expression.params), param) as ProjectionEntityExpression;
                            const fnExpression = ExpressionFactory.prototype.ToExpression((o: TType[]) => o.first(), Array);
                            projectionEntity = this.visit(new MethodCallExpression(projectionEntity, "select", [fnExpression]), param) as ProjectionEntityExpression;
                        }
                        else {
                            selectExp.distinct = true;
                        }
                        return projectionEntity;
                    }
                case "include":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        const selectExp = projectionEntity.select;
                        for (const selectorfn of expression.params) {
                            const selector = selectorfn as FunctionExpression<TType, TResult>;
                            this.parameters.add(selector.params[0].name, expression.objectOperand.type);
                            const selectExpression = this.visit(selector, { parent: projectionEntity.select });
                            this.parameters.remove(selector.params[0].name);

                            if ((selectExpression as IEntityExpression).columns) {
                                const entityExpression = selectExpression as IEntityExpression;
                                for (const column of entityExpression.columns)
                                    selectExp.columns.add(column);
                            }
                            else if ((selectExpression as IColumnExpression).entity) {
                                const columnExpression = selectExpression as IColumnExpression;
                                selectExp.columns.add(columnExpression);
                            }
                        }
                        return projectionEntity;
                    }
                case "orderBy":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        const selectExp = projectionEntity.select;
                        const selector = expression.params[0] as FunctionExpression<TType, boolean>;
                        const direction = expression.params[1] as ValueExpression<orderDirection>;
                        this.parameters.add(selector.params[0].name, expression.objectOperand.type);
                        const orderByExpression = this.visit(selector, { parent: projectionEntity.select });
                        this.parameters.remove(selector.params[0].name);
                        selectExp.orders.add({ column: orderByExpression, direction: direction.execute() });
                        return projectionEntity;
                    }
                case "skip":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        const selectExp = projectionEntity.select;
                        const skipExp = expression.params[0] as ValueExpression<number>;
                        selectExp.paging.skip = skipExp.execute();
                        return projectionEntity;
                    }
                case "take":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        const selectExp = projectionEntity.select;
                        const takeExp = expression.params[0] as ValueExpression<number>;
                        selectExp.paging.take = takeExp.execute();
                        return projectionEntity;
                    }
                case "selectMany":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        let selectExp = projectionEntity.select;
                        const selector = expression.params[0] as FunctionExpression<TType, TResult[]>;
                        this.parameters.add(selector.params[0].name, expression.objectOperand.type);
                        const selectExpression = this.visit(selector, param);
                        this.parameters.remove(selector.params[0].name);

                        selectExp.columns = [];
                        if ((selectExpression as IEntityExpression).columns) {
                            const entityExpression = selectExpression as IEntityExpression;
                            if (!selectExp.where) {
                                selectExp = projectionEntity.select = new SelectExpression(entityExpression);
                            }
                            else {
                                // TODO
                                this.reverseJoinEntity(selectExp.entity, entityExpression);
                            }
                        }
                        else {
                            throw Error(`Queryable<{projectionEntity.type.name}>.selectMany({selector.toString(this)}) did not return entity`);
                        }
                        return projectionEntity;
                    }
                case "groupBy":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        const selectExp = projectionEntity.select;
                        const groupExpression = new GroupByExpression<any, any>(new SelectExpression(projectionEntity));
                        const keySelector = expression.params[0] as FunctionExpression<TType, TResult>;
                        this.parameters.add(keySelector.params[0].name, expression.objectOperand.type);
                        const selectExpression = this.visit(keySelector, param);
                        this.parameters.remove(keySelector.params[0].name);

                        if ((selectExpression as IEntityExpression).columns) {
                            const entityExpression = selectExpression as IEntityExpression;
                            groupExpression.groupBy = entityExpression.columns;
                        }
                        else if ((selectExpression as IColumnExpression).entity) {
                            const columnExpression = selectExpression as IColumnExpression;
                            groupExpression.groupBy.add(columnExpression);
                        }
                        else if (selectExpression instanceof ObjectValueExpression) {
                            // TODO: select expression like o => {asd: o.Prop} need optimization. remove unused relation/join
                            groupExpression.groupBy = Object.keys(selectExpression.object).select(
                                (o) => selectExpression.object[o] instanceof ColumnExpression ? selectExpression.object[o] : new ComputedColumnExpression(selectExp.entity, selectExpression.object[o], this.newAlias("column"))
                            ).toArray();
                        }
                        else {
                            const columnExpression = new ComputedColumnExpression(projectionEntity, selectExpression, this.newAlias("column"));
                            groupExpression.groupBy.add(columnExpression);
                        }

                        const newProjectionEntity = new ProjectionEntityExpression(groupExpression, this.newAlias(), Object);
                        param.parent.replaceEntity(projectionEntity, newProjectionEntity);
                        return newProjectionEntity;
                    }
                case "toArray":
                    {
                        return parentEntity;
                    }
                case "first":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        if (expression.params.length > 0) {
                            projectionEntity = this.visit(new MethodCallExpression(projectionEntity, "where", [expression.params[0]]), param) as ProjectionEntityExpression;
                        }
                        const selectExp = projectionEntity.select;
                        selectExp.paging.take = 1;
                        return projectionEntity;
                    }
                case "last":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }
                        if (projectionEntity.select.orders.length > 0) {
                            for (const order of projectionEntity.select.orders) {
                                order.direction = order.direction === "ASC" ? "DESC" : "ASC";
                            }
                        }
                        // TODO: reverse default order.

                        return this.visit(new MethodCallExpression(projectionEntity, "first", expression.params), param);
                    }
                case "count":
                case "sum":
                case "avg":
                case "max":
                case "min":
                    {
                        let entity = parentEntity;
                        if (expression.params.length > 0) {
                            entity = this.visit(new MethodCallExpression(entity, "select", [expression.params[0]]), param) as IEntityExpression;
                        }
                        return new ComputedColumnExpression(parentEntity, new MethodCallExpression(entity, expression.methodName, []), this.newAlias("column"));
                    }
                case "all":
                case "any":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }

                        if (expression.params.length > 0) {
                            projectionEntity = this.visit(new MethodCallExpression(projectionEntity, "where", [expression.params[0]]), param) as ProjectionEntityExpression;
                        }
                        return new ComputedColumnExpression(parentEntity, new MethodCallExpression(parentEntity, expression.methodName, []), this.newAlias("column"));
                    }
                case "contain":
                    {
                        const entityMeta: IEntityMetaData<TType, any> = Reflect.getOwnMetadata(entityMetaKey, expression.params[0].type);
                        if (!entityMeta) {
                            throw new Error(`${expression.methodName} only support entity`);
                        }
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            param.parent.replaceEntity(parentEntity, projectionEntity);
                        }
                        for (const pk of entityMeta.primaryKeys) {
                            const primaryColumn = projectionEntity.columns.first((c) => c.property === pk);
                            if (!primaryColumn)
                                throw new Error(`primaryColumn not exist`);
                            this.visit(new MethodCallExpression(projectionEntity, "where", [new EqualExpression(primaryColumn, new MemberAccessExpression(expression.params[0], pk))]), { parent: projectionEntity.select });
                        }
                        return new ComputedColumnExpression(parentEntity, new MethodCallExpression(parentEntity, "any", []), this.newAlias("column"));
                    }
                case "except":
                case "fullJoin":
                case "innerJoin":
                case "intersect":
                case "leftJoin":
                case "pivot":
                case "rightJoin":
                case "union":
                default:
                    throw new Error(`${expression.methodName} not supported on expression`);
            }
        }
        else {
            if (expression.objectOperand instanceof ValueExpression) {
                if (expression.objectOperand.value === Math) {
                    switch (expression.methodName) {
                        case "max":
                        case "min":
                            {
                                const entity = this.visit(expression.params[0], param) as IEntityExpression;
                                return new ComputedColumnExpression(entity, new MethodCallExpression(entity, expression.methodName, []), this.newAlias("column"));
                            }
                    }
                }
            }
            expression.params = expression.params.select((o) => this.visit(o, param)).toArray();
        }

        return expression;
    }
    /**
     * reverse join entity for selectmany. ex:
     * ori: order => orderDetails = left join
     * target: orderDetail => order = inner join
     */
    protected reverseJoinEntity(rootEntity: IEntityExpression, entity: IEntityExpression): boolean {
        if (rootEntity instanceof JoinEntityExpression) {
            const isRight = this.reverseJoinEntity(rootEntity.rightEntity, entity);
            if (isRight) {
                rootEntity.joinType = "INNER";
                const rightEntity = rootEntity.rightEntity;
                rootEntity.rightEntity = rootEntity.leftEntity;
                rootEntity.leftEntity = rightEntity;
                rootEntity.relations = rootEntity.relations.select((o) => ({ leftColumn: o.rightColumn, rightColumn: o.leftColumn })).toArray();
                return true;
            }
            return this.reverseJoinEntity(rootEntity.leftEntity, entity);
        }
        else if (rootEntity instanceof ProjectionEntityExpression) {
            return this.reverseJoinEntity(rootEntity.select.entity, entity);
        }
        return rootEntity === entity;
    }
    protected visitFunctionCall<T>(expression: FunctionCallExpression<T>, param: { parent: ICommandQueryExpression }): IExpression {
        expression.params = expression.params.select((o) => this.visit(o, param)).toArray();
        return expression;
    }
    protected visitBinaryOperator(expression: IBinaryOperatorExpression, param: { parent: ICommandQueryExpression }): IExpression {
        expression.leftOperand = this.visit(expression.leftOperand, param);
        expression.rightOperand = this.visit(expression.rightOperand, param);
        return expression;
    }
    protected visitUnaryOperator(expression: IUnaryOperatorExpression, param: { parent: ICommandQueryExpression }): IExpression {
        expression.operand = this.visit(expression.operand, param);
        return expression;
    }
    protected visitTernaryOperator(expression: TernaryExpression<any>, param: { parent: ICommandQueryExpression }): IExpression {
        expression.logicalOperand = this.visit(expression.logicalOperand, param);
        expression.trueResultOperand = this.visit(expression.trueResultOperand, param);
        expression.falseResultOperand = this.visit(expression.falseResultOperand, param);
        return expression;
    }
    protected visitObjectLiteral<T extends { [Key: string]: IExpression } = any>(expression: ObjectValueExpression<T>, param: { parent: ICommandQueryExpression }) {
        // tslint:disable-next-line:forin
        for (const prop in expression.object) {
            expression.object[prop] = this.visit(expression.object[prop], param);
        }
        return expression;
    }
    private fillZero(value: number): string {
        return value < 10 ? ("0" + value).slice(-2) : value.toString();
    }
}
