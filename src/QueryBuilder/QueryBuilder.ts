import {
    AdditionExpression, AndExpression, ArrayValueExpression, BitwiseAndExpression,
    BitwiseNotExpression, BitwiseOrExpression, BitwiseSignedRightShiftExpression,
    BitwiseXorExpression, BitwiseZeroLeftShiftExpression, BitwiseZeroRightShiftExpression,
    DivisionExpression, EqualExpression, FunctionCallExpression, FunctionExpression,
    GreaterEqualExpression, GreaterThanExpression,
    IExpression, InstanceofExpression,
    LeftDecrementExpression, LeftIncrementExpression, LessEqualExpression, LessThanExpression,
    MemberAccessExpression, MethodCallExpression, NotEqualExpression, NegationExpression, ObjectValueExpression,
    OrExpression, ParameterExpression, RightDecrementExpression,
    RightIncrementExpression, StrictEqualExpression, StrictNotEqualExpression, SubtractionExpression,
    TernaryExpression, MultiplicationExpression, TypeofExpression, ValueExpression, IBinaryOperatorExpression, IUnaryOperatorExpression
} from "../ExpressionBuilder/Expression";
import { ModulusExpression } from "../ExpressionBuilder/Expression/ModulusExpression";
import { ExpressionTransformer } from "../ExpressionBuilder/ExpressionTransformer";
import { TransformerParameter } from "../ExpressionBuilder/TransformerParameter";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { ColumnExpression, ComputedColumnExpression, ExceptExpression, IEntityExpression, IntersectExpression, ProjectionEntityExpression } from "../Queryable/QueryExpression/index";
import { SelectExpression, IJoinRelation } from "../Queryable/QueryExpression/SelectExpression";
import { SqlFunctionCallExpression } from "../Queryable/QueryExpression/SqlFunctionCallExpression";
import { UnionExpression } from "../Queryable/QueryExpression/UnionExpression";
import { IQueryVisitParameter, QueryExpressionVisitor } from "./QueryExpressionVisitor";
import { fillZero } from "../Helper/Util";
import { JoinType, ValueType, GenericType } from "../Common/Type";
import { StringColumnMetaData, BooleanColumnMetaData, NumericColumnMetaData, DecimalColumnMetaData, DateColumnMetaData, EnumColumnMetaData, ColumnMetaData } from "../MetaData";
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
import { columnMetaKey } from "../Decorator/DecoratorKey";
import { IEntityMetaData } from "../MetaData/Interface";
import { IQueryCommand } from "./Interface/IQueryCommand";
import { EntityEntry } from "../Data/EntityEntry";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IConstraintMetaData } from "../MetaData/Interface/IConstraintMetaData";
import { ICheckConstraintMetaData } from "../MetaData/Interface/ICheckConstraintMetaData";
import { IIndexMetaData } from "../MetaData/Interface/IIndexMetaData";
import { EmbeddedColumn } from "../Decorator/Column";
import { EmbeddedColumnExpression } from "../Queryable/QueryExpression/EmbeddedColumnExpression";

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
            case NegationExpression:
                result = this.getNegationExpressionString(expression as any);
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
    protected getColumnType<T>(column: IColumnMetaData<T> | IColumnExpression<T> | ValueType): string {
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
        if (expression.objectOperand instanceof SelectExpression) {
            switch (expression.methodName) {
                case "all":
                    return "NOT EXIST(" + this.newLine(++this.indent) + this.getExpressionString(expression.objectOperand) + this.newLine(--this.indent) + ")";
                case "any":
                    return "EXIST(" + this.newLine(++this.indent) + this.getExpressionString(expression.objectOperand) + this.newLine(--this.indent) + ")";
                case "count":
                    return "COUNT(*)";
                case "sum":
                case "min":
                case "max":
                case "avg":
                    return expression.methodName.toUpperCase() + "(" + this.getExpressionString(expression.params[0] as any) + ")";
            }
        }
        else if (expression.objectOperand instanceof ValueExpression) {
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
                        break;
                    case "toString":
                        return `CAST(${this.getExpressionString(expression.objectOperand)} AS nvarchar(255))`;
                    case "valueOf":
                        return this.getExpressionString(expression.objectOperand);

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
            case RegExp:
                switch (expression.methodName) {
                    case "test":
                        return this.getExpressionString(expression.params[0]) + " REGEXP " + this.getExpressionString(expression.objectOperand);
                    case "exec":
                    case "toString":
                        throw new Error(`${expression.methodName} not supported.`);
                    default:
                        throw new Error(`non-standard/deprecated ${expression.methodName} method not supported.`);
                }
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
            case Array:
                switch (expression.methodName) {
                    case "contains":
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
                break;
        }
        const methodFn = expression.objectOperand.type.prototype[expression.methodName];
        if (methodFn) {
            const fnExpression = ExpressionBuilder.parse(methodFn, [expression.objectOperand.type]);
            for (let i = 0; i < fnExpression.params.length; i++) {
                const param = fnExpression.params[i];
                this.scopeParameters.add(param.name, expression.params[i]);
            }
            this.scopeParameters.add("this", expression.objectOperand);
            const result = this.getExpressionString(fnExpression.body);
            return result;
        }
        throw new Error(`type ${(expression.objectOperand.type as any).name} not supported in linq to sql.`);
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
    protected getNegationExpressionString(expression: NegationExpression): string {
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
    public getInsertQuery<T>(entityMetaData: IEntityMetaData<T>, entries: Array<EntityEntry<T>>): IQueryCommand {
        if (entries.length <= 0)
            return null;

        const columns = entityMetaData.columns.select(o => ({
            propertyName: o.propertyName,
            metaData: o
        }));
        const generatedColumns = columns.where(o => {
            const meta = o.metaData;
            return meta.default !== undefined || meta instanceof TimeColumnMetaData
                || meta instanceof IdentifierColumnMetaData || (meta instanceof NumericColumnMetaData && meta.autoIncrement);
        });
        const valueColumns = columns.where(o => !(o.metaData instanceof IdentifierColumnMetaData || (o.metaData instanceof NumericColumnMetaData && o.metaData.autoIncrement)));
        const columnNames = valueColumns.select(o => this.enclose(o.metaData.columnName)).toArray().join(", ");
        const outputQuery = generatedColumns.select(o => "INSERTED." + this.enclose(o.metaData.columnName)).toArray().join(", ");

        const result: IQueryCommand = {
            query: "",
            parameters: new Map()
        };
        result.query = `INSERT INTO ${this.enclose(entityMetaData.name)}(${columnNames}) ${outputQuery ? "OUTPUT " + outputQuery : ""} VALUES `;
        result.query += entries.map((o, i) => {
            const entry = entries[i];
            const entity = entry.entity;
            return "(" + valueColumns.select(o => {
                const value = entity[o.propertyName as keyof T];
                if (value === undefined) {
                    return "DEFAULT";
                }
                else {
                    const paramName = this.newAlias("param");
                    result.parameters.set(paramName, value);
                    return "@" + paramName;
                }
            }).toArray().join(",") + ")";
        }).join(", ");
        return result;
    }
    public getUpdateQuery<T>(entityMetaData: IEntityMetaData<T>, entry: EntityEntry<T>): IQueryCommand {
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

        result.query = `UPDATE ${entityMetaData.name} SET ${set} WHERE ${where}`;
        return result;
    }
    public getDeleteQuery<T>(entityMetaData: IEntityMetaData<T>, entries: Array<EntityEntry<T>>): IQueryCommand {
        if (entries.length <= 0)
            return null;

        const result: IQueryCommand = {
            query: "",
            parameters: new Map()
        };
        let condition = "";
        if (entityMetaData.primaryKeys.length === 1) {
            const primaryCol = entityMetaData.primaryKeys.first();
            const primaryValues = entries.select(o => {
                const paramName = this.newAlias("param");
                result.parameters.set(paramName, o.entity[primaryCol.propertyName]);
                return `@${paramName}`;
            }).toArray().join(",");
            condition = `WHERE ${primaryCol.propertyName} IN (${primaryValues})`;
        }
        else {
            const columnName = entityMetaData.primaryKeys.select(o => o.columnName).toArray().join(",");
            const primaryValues = entries.select(o => "(" + entityMetaData.primaryKeys.select(c => {
                const paramName = this.newAlias("param");
                result.parameters.set(paramName, o.entity[c.propertyName]);
                return `@${paramName}`;
            }).toArray().join(",") + ")").toArray().join(",");
            const entityAlias = this.newAlias();
            const valueAlias = this.newAlias();
            const joins = entityMetaData.primaryKeys.select(o => `${entityAlias}.${o.columnName} = ${valueAlias}.${o.columnName}`).toArray().join(" AND ");
            condition = `${entityAlias} JOIN (VALUES ${primaryValues}) AS ${valueAlias} (${columnName}) ON ${joins}`;
        }
        result.query = `DELETE FROM ${this.enclose(entityMetaData.name)} ${condition}`;
        return result;
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
        const isNullableChange = (!!columnSchema.nullable && !(columnSchema as NumericColumnMetaData).autoIncrement) !== (!!oldColumnSchema.nullable && !(oldColumnSchema as NumericColumnMetaData).autoIncrement);
        let isDefaultChange = (columnSchema.default ? this.defaultValue(columnSchema) : null) !== (oldColumnSchema.default ? this.defaultValue(oldColumnSchema) : null);
        const isIdentityChange = !!(columnSchema as NumericColumnMetaData).autoIncrement !== !!(oldColumnSchema as NumericColumnMetaData).autoIncrement;
        const isColumnChange = isNullableChange || columnSchema.columnType !== columnSchema.columnType
            || (columnSchema.collation && columnSchema.collation !== columnSchema.collation)
            || ((columnSchema as NumericColumnMetaData).length !== undefined && (oldColumnSchema as NumericColumnMetaData).length !== undefined && (columnSchema as NumericColumnMetaData).length !== (oldColumnSchema as NumericColumnMetaData).length)
            || ((columnSchema as DecimalColumnMetaData).precision !== undefined && (oldColumnSchema as DecimalColumnMetaData).precision !== undefined && (columnSchema as DecimalColumnMetaData).precision !== (oldColumnSchema as DecimalColumnMetaData).precision)
            || ((columnSchema as DecimalColumnMetaData).scale !== undefined && (oldColumnSchema as DecimalColumnMetaData).scale !== undefined && (columnSchema as DecimalColumnMetaData).scale !== (oldColumnSchema as DecimalColumnMetaData).scale);

        if (isDefaultChange && oldColumnSchema.default) {
            result = result.concat(this.dropDefaultContraintQuery(oldColumnSchema));
        }
        if (isNullableChange) {
            if (!columnSchema.nullable && !(oldColumnSchema as NumericColumnMetaData).autoIncrement) {
                // if change from nullable to not nullable, set all existing data to default value.
                const fallbackValue = this.defaultValue(columnSchema);
                result.push({
                    query: `UPDATE ${this.entityName(entitySchema)} SET ${this.enclose(columnSchema.columnName)} = ${fallbackValue} WHERE ${this.enclose(columnSchema.columnName)} IS NULL`
                });
            }
        }
        if (isIdentityChange) {
            const toAutoIncrement = (columnSchema as NumericColumnMetaData).autoIncrement;
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
        let query = `CREATE TABLE ${this.enclose(entityMetaData.schema)}.${this.enclose(entityMetaData.name)}` +
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
        return `CONSTRAINT ${this.enclose(relationMeta.name)}` +
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
            return columnMeta.default instanceof FunctionExpression ? this.getExpressionString(columnMeta.default.body) : columnMeta.default;
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
        return `ALTER TABLE ${this.entityName(relationMeta.target)} ADD CONSTRAINT ${this.enclose(relationMeta.name)} FOREIGN KEY` +
            ` (${relationMeta.reverseRelation.relationColumns.select(r => this.enclose(r.columnName)).toArray().join(",")})` +
            ` REFERENCES ${this.entityName(relationMeta.source)} (${relationMeta.relationColumns.select(r => r.columnName).toArray().join(",")})` +
            ` ON UPDATE ${relationMeta.updateOption} ON DELETE ${relationMeta.deleteOption}`;
    }
    public dropForeignKeyQuery(relationMeta: IRelationMetaData): IQueryCommand[] {
        const query = `ALTER TABLE ${this.entityName(relationMeta.source)} DROP CONSTRAINT ${this.enclose(relationMeta.name)}`;
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
