import { genericType, IObjectType, RelationType } from "../Common/Type";
import { ComputedColumn } from "../Decorator/Column/index";
import { columnMetaKey, relationMetaKey } from "../Decorator/DecoratorKey";
import { AdditionExpression, AndExpression, BitwiseAndExpression, BitwiseOrExpression, BitwiseSignedRightShiftExpression, BitwiseXorExpression, BitwiseZeroLeftShiftExpression, BitwiseZeroRightShiftExpression, DivisionExpression, EqualExpression, FunctionExpression, GreaterEqualExpression, GreaterThanExpression, IBinaryOperatorExpression, IExpression, InstanceofExpression, LessEqualExpression, LessThanExpression, MemberAccessExpression, MethodCallExpression, NotEqualExpression, OrExpression, ParameterExpression, StrictEqualExpression, StrictNotEqualExpression, SubtractionExpression, TimesExpression, IUnaryOperatorExpression, BitwiseNotExpression, LeftDecrementExpression, LeftIncrementExpression, NotExpression, RightDecrementExpression, RightIncrementExpression, TypeofExpression, ValueExpression, FunctionCallExpression, TernaryExpression, ObjectValueExpression } from "../ExpressionBuilder/Expression";
import { ExpressionTransformer } from "../ExpressionBuilder/ExpressionTransformer";
import { IRelationMetaData } from "../MetaData/Interface/index";
import { MasterRelationMetaData } from "../MetaData/Relation/index";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "./Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "./Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "./Queryable/QueryExpression/IColumnExpression";
import { ICommandQueryExpression } from "./Queryable/QueryExpression/ICommandQueryExpression";
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
    public toColumnString(column: IColumnExpression) {
        return this.escape(column.entity.alias) + "." + this.escape(column.alias ? column.alias : column.name);
    }
    public toEntityString(entity: EntityExpression): string {
        if (entity instanceof SelectExpression)
            return "(" + entity.toString(this) + ") AS " + this.escape(entity.alias);
        else
            return this.escape(entity.name) + (entity.alias ? " AS " + this.escape(entity.alias) : "");
    }
    public toJoinEntityString(entity: JoinEntityExpression) {
        return entity.leftEntity.toString(this) + " " +
            entity.joinType + " JOIN " +
            entity.rightEntity.toString(this) +
            " ON " + entity.relations.select((o) => o.leftColumn.toString(this) + " = " + o.rightColumn.toString(this)).toArray().join(" AND ");
    }
    public toSelectString(select: SelectExpression | WhereExpression | UnionExpression | GroupByExpression): string {
        if (select instanceof WhereExpression)
            return this.toWhereString(select);
        if (select instanceof UnionExpression)
            return this.toUnionString(select);
        let result = "SELECT " +
            (select.distinct ? " DISTINCT" : "") + " " +
            (select.top ? "TOP " + select.top : "") + " " +
            select.columns.select((o) => o.toString(this)).toArray().join(", ") + " " +
            "FROM " + this.toEntityString(select.entity);
        if (select instanceof GroupByExpression)
            result += " GROUP BY " + select.groupBy.select((o) => o.toString(this)).toArray().join(", ");
        return result;
    }
    public toWhereString(where: WhereExpression): string {
        return this.toSelectString(where.select) + " " +
            (where.select instanceof GroupByExpression ? "HAVING " : "WHERE ") + where.where.toString();
    }
    public toOrderString(order: OrderByExpression): string {
        return this.toSelectString(order.select) + " " +
            "ORDER BY " + order.orders.select((o) => o.column.toString(this) + " " + o.direction).toArray().join(", ");
    }
    public toUnionString(union: UnionExpression) {
        return union.entity.toString(this) +
            "UNION " + (union.isUnionAll ? "ALL " : "") +
            union.entity2.toString(this);
    }


    public processMethod<TType, KProp extends keyof TType, TResult = any>(expression: MethodCallExpression<TType, KProp, TResult>, param: { parent: ICommandQueryExpression }): IExpression {
        const res: IExpression = expression.ObjectOperand.execute(this);
        switch (res.type) {
            case String:
                switch (expression.MethodName) {
                    case "charAt":
                        break;
                    case "charCodeAt":
                        break;
                    case "concat":
                        break;
                    case "charAt":
                        break;
                    case "endsWith":
                        break;
                    case "includes":
                        break;
                    case "indexOf":
                        break;
                    case "lastIndexOf":
                        break;
                    case "localeCompare":
                        break;
                    case "repeat":
                        break;
                    case "replace":
                        break;
                    case "search":
                        break;
                    case "slice":
                        break;
                    case "split":
                        break;
                    case "startsWith":
                        break;
                    case "substr":
                        break;
                    case "substring":
                        break;
                    case "toLowerCase":
                    case "toLocaleLowerCase":
                        break;
                    case "toUpperCase":
                    case "toLocaleUpperCase":
                        break;
                    case "toString":
                    case "valueOf":
                        break;
                    case "trim":
                        break;
                    case "match":
                    default:
                        throw new Error(`method "String.{expression.MethodName}" not supported in linq to sql.`);
                }
                break;
            case Number:
                break;
            case Boolean:
                break;
            case Symbol:
                break;
            case Object:
                // Math object here
                break;
            case Function:
                break;
            default:
                throw new Error(`type {res.type.name} not supported in linq to sql.`);
        }
        return expression;
    }
    /**
     * Expression visitor
     */
    public visit(expression: IExpression, param: { parent: ICommandQueryExpression }): any {
        switch (expression.constructor) {
            case FunctionExpression:
                this.visit((expression as FunctionExpression).Body, param);
                break;
            case MemberAccessExpression:
                return this.visitMember(expression as any, param);
            case MethodCallExpression:
                return this.visitMethod(expression as any, param);
            case FunctionCallExpression:
                return this.visitFunction(expression as any, param);
            case ParameterExpression:
                return expression;
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
        }
        return expression;
    }
    protected visitMember<TType, KProp extends keyof TType>(expression: MemberAccessExpression<TType, KProp>, param: { parent: ICommandQueryExpression }): IExpression {
        const res: IExpression = this.visit(expression.ObjectOperand, param);
        if (expression.memberName === "prototype" || expression.memberName === "__proto__")
            throw new Error(`property {expression.memberName} not supported in linq to sql.`);

        if (res.type === Array && expression.memberName === "length") {
            return new MethodCallExpression(res, "count", []);
        }
        const relationMeta: IRelationMetaData<any, any> = Reflect.getOwnMetadata(relationMetaKey, res.type, expression.memberName as string);
        if (relationMeta) {
            const targetType = relationMeta instanceof MasterRelationMetaData ? relationMeta.slaveType! : relationMeta.masterType!;
            if (!param.parent.entity.has(targetType as IObjectType<any>)) {
                const joinEntity = new JoinEntityExpression(param.parent.entity, new EntityExpression(targetType, this.newAlias()), this.newAlias(), relationMeta.relationType === RelationType.OneToMany ? "LEFT" : "INNER");
                joinEntity.relations = Object.keys(relationMeta.relationMaps!).select((o) => ({
                    leftColumn: joinEntity.leftEntity.columns.first((c) => c.property === o),
                    rightColumn: joinEntity.rightEntity.columns.first((c) => c.property === relationMeta.relationMaps![o])
                })).toArray();
                param.parent.entity = joinEntity;
                return joinEntity.rightEntity;
            }
            return param.parent.entity.get(targetType);
        }
        const entityExpression = param.parent.entity.get(res.type as any);
        if (entityExpression) {
            const column = entityExpression.columns.first((c) => c.property === expression.memberName);
            if (column)
                return column;
        }
        throw new Error(`property {expression.memberName} not supported in linq to sql.`);
    }
    protected visitMethod<TType, KProp extends keyof TType, TResult = any>(expression: MethodCallExpression<TType, KProp, TResult>, param: { parent: ICommandQueryExpression }): IExpression {
        expression.ObjectOperand = this.visit(expression.ObjectOperand, param);
        expression.Params = expression.Params.select((o) => this.visit(o, param)).toArray();
        return expression;
    }
    protected visitFunction<T>(expression: FunctionCallExpression<T>, param: { parent: ICommandQueryExpression }): IExpression {
        expression.params = expression.params.select((o) => this.visit(o, param)).toArray();
        return expression;
    }
    protected visitBinaryOperator(expression: IBinaryOperatorExpression, param: { parent: ICommandQueryExpression }) {
        expression.leftOperand = this.visit(expression.leftOperand, param);
        expression.rightOperand = this.visit(expression.rightOperand, param);
        return expression;
    }
    protected visitUnaryOperator(expression: IUnaryOperatorExpression, param: { parent: ICommandQueryExpression }) {
        expression.operand = this.visit(expression.operand, param);
        return expression;
    }
    protected visitTernaryOperator(expression: TernaryExpression<any>, param: { parent: ICommandQueryExpression }) {
        expression.logicalOperand = this.visit(expression.logicalOperand, param);
        expression.trueResultOperand = this.visit(expression.trueResultOperand, param);
        expression.falseResultOperand = this.visit(expression.falseResultOperand, param);
        return expression;
    }
    protected visitObjectLiteral<T extends { [Key: string]: IExpression } = any>(expression: ObjectValueExpression<T>, param: { parent: ICommandQueryExpression }) {
        // tslint:disable-next-line:forin
        for (const prop in expression.Object) {
            expression.Object[prop] = this.visit(expression.Object[prop], param);
        }
        return expression;
    }
}
