import { IObjectType, orderDirection, RelationType } from "../Common/Type";
import { ComputedColumn } from "../Decorator/Column/index";
import { columnMetaKey, relationMetaKey } from "../Decorator/DecoratorKey";
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
import { ExpressionFactory } from "../ExpressionBuilder/ExpressionFactory";
import { ExpressionTransformer } from "../ExpressionBuilder/ExpressionTransformer";
import { IRelationMetaData } from "../MetaData/Interface/index";
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
                    case "like":
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
                return this.visitFunction(expression as FunctionExpression, param);
            case MemberAccessExpression:
                return this.visitMember(expression as any, param);
            case MethodCallExpression:
                return this.visitMethod(expression as any, param);
            case FunctionCallExpression:
                return this.visitFunctionCall(expression as any, param);
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
    protected visitFunction<T, TR>(expression: FunctionExpression<T, TR>, param: { parent: ICommandQueryExpression }) {
        expression.Body = this.visit(expression.Body, param);
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
        if ((expression.ObjectOperand as IEntityExpression).columns) {
            switch (expression.MethodName) {
                case "where":
                    {
                        const fnExpression = expression.Params[0] as FunctionExpression<TType, boolean>;
                        this.parameters.add(fnExpression.Params[0].name, expression.ObjectOperand.type);
                        const whereExpression: FunctionExpression<TType, boolean> = this.visit(fnExpression, param);
                        this.parameters.remove(fnExpression.Params[0].name);
                        param.parent.where = whereExpression.Body;
                        return whereExpression;
                    }
                case "select":
                    {
                        let selectExp = param.parent as SelectExpression;
                        const fnExpression = expression.Params[0] as FunctionExpression<TType, TResult>;
                        this.parameters.add(fnExpression.Params[0].name, expression.ObjectOperand.type);
                        const resultExp: FunctionExpression<TType, TResult> = this.visit(fnExpression, param);
                        const selectExpression = resultExp.Body;
                        this.parameters.remove(fnExpression.Params[0].name);

                        selectExp.columns = [];
                        if ((selectExpression as IEntityExpression).columns) {
                            if (!selectExp.where) {
                                const entityExpression = selectExpression as IEntityExpression;
                                selectExp = param.parent = new SelectExpression(entityExpression);
                            }
                        }
                        else if ((selectExpression as IColumnExpression).entity) {
                            const columnExpression = selectExpression as IColumnExpression;
                            if (!selectExp.where)
                                selectExp = param.parent = new SelectExpression(columnExpression.entity);
                            selectExp.columns.add(columnExpression);
                        }
                        else if (selectExpression instanceof ObjectValueExpression) {
                            selectExp.columns = Object.keys(selectExpression.Object).select(
                                (o) => selectExpression.Object[o] instanceof ColumnExpression ? selectExpression.Object[o] : new ComputedColumnExpression(selectExp.entity, selectExpression.Object[o], this.newAlias("column"))
                            ).toArray();
                        }
                        return resultExp;
                    }
                case "distinct":
                    {
                        const selectExp = param.parent as SelectExpression;
                        if (expression.Params.length > 0) {
                            const groupExpression = new GroupByExpression<any, any>(selectExp);
                            const keySelector = expression.Params[0] as FunctionExpression<TType, TResult>;
                            this.parameters.add(keySelector.Params[0].name, expression.ObjectOperand.type);
                            const resultExp: FunctionExpression<TType, TResult> = this.visit(keySelector, param);
                            const selectExpression = resultExp.Body;
                            this.parameters.remove(keySelector.Params[0].name);

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
                                groupExpression.groupBy = Object.keys(selectExpression.Object).select(
                                    (o) => selectExpression.Object[o] instanceof ColumnExpression ? selectExpression.Object[o] : new ComputedColumnExpression(selectExp.entity, selectExpression.Object[o], this.newAlias("column"))
                                ).toArray();
                            }
                            param.parent = groupExpression;

                            let selectExp2 = groupExpression as SelectExpression;
                            this.parameters.add("o", expression.ObjectOperand.type);
                            const fnExpression = ExpressionFactory.prototype.ToExpression((o: TType[]) => o.first(), Array);
                            const resultExp2 = this.visit(fnExpression, param);
                            const selectExpression2 = resultExp2.Body;
                            this.parameters.remove(fnExpression.Params[0].name);

                            selectExp2.columns = [];
                            if ((selectExpression2 as IEntityExpression).columns) {
                                if (!selectExp2.where) {
                                    const entityExpression = selectExpression2 as IEntityExpression;
                                    selectExp2 = param.parent = new SelectExpression(entityExpression);
                                }
                            }
                            else if ((selectExpression2 as IColumnExpression).entity) {
                                const columnExpression = selectExpression2 as IColumnExpression;
                                if (!selectExp2.where)
                                    selectExp2 = param.parent = new SelectExpression(columnExpression.entity);
                                selectExp2.columns.add(columnExpression);
                            }
                            else if (selectExpression2 instanceof ObjectValueExpression) {
                                selectExp2.columns = Object.keys(selectExpression2.Object).select(
                                    (o) => selectExpression2.Object[o] instanceof ColumnExpression ? selectExpression2.Object[o] : new ComputedColumnExpression(selectExp2.entity, selectExpression2.Object[o], this.newAlias("column"))
                                ).toArray();
                            }
                            return resultExp2;
                        }
                        else {
                            selectExp.distinct = true;
                            return expression;
                        }
                    }
                case "include":
                    {
                        const selectExp = param.parent as SelectExpression;
                        for (let i = 0; i < expression.Params.length; i++) {
                            const selectorfn = expression.Params[i];
                            const selector = selectorfn as FunctionExpression<TType, TResult>;
                            this.parameters.add(selector.Params[0].name, expression.ObjectOperand.type);
                            const resultExp: FunctionExpression = this.visit(selector, param);
                            const selectExpression = resultExp.Body;
                            expression.Params[i] = resultExp;
                            this.parameters.remove(selector.Params[0].name);

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
                        return expression;
                    }
                case "orderBy":
                    {
                        const selectExp = param.parent as SelectExpression;
                        const selector = expression.Params[0] as FunctionExpression<TType, boolean>;
                        const direction = expression.Params[1] as ValueExpression<orderDirection>;
                        this.parameters.add(selector.Params[0].name, expression.ObjectOperand.type);
                        const resultExp: FunctionExpression<TType, TResult> = this.visit(selector, param);
                        const orderByExpression = resultExp.Body;
                        this.parameters.remove(selector.Params[0].name);
                        selectExp.orders.add({ column: orderByExpression, direction: direction.execute() });
                        return resultExp;
                    }
                case "skip":
                    {
                        const selectExp = param.parent as SelectExpression;
                        const skipExp = expression.Params[0] as ValueExpression<number>;
                        selectExp.paging.skip = skipExp.execute();
                        return expression;
                    }
                case "take":
                    {
                        const selectExp = param.parent as SelectExpression;
                        const takeExp = expression.Params[0] as ValueExpression<number>;
                        selectExp.paging.take = takeExp.execute();
                        return expression;
                    }
                case "selectMany":
                    {
                        let selectExp = param.parent as SelectExpression;
                        const selector = expression.Params[0] as FunctionExpression<TType, TResult[]>;
                        this.parameters.add(selector.Params[0].name, expression.ObjectOperand.type);
                        const resultExp: FunctionExpression<TType, TResult[]> = this.visit(selector, param);
                        const selectExpression = resultExp.Body;
                        this.parameters.remove(selector.Params[0].name);

                        selectExp.columns = [];
                        if ((selectExpression as IEntityExpression).columns) {
                            const entityExpression = selectExpression as IEntityExpression;
                            if (!param.parent.where) {
                                selectExp = param.parent = new SelectExpression(entityExpression);
                            }
                            else {
                                this.reverseJoinEntity(selectExp.entity, entityExpression);
                            }
                        }
                        return resultExp;
                    }
                case "groupBy":
                    {
                        const selectExp = param.parent as SelectExpression;
                        const groupExpression = new GroupByExpression<any, any>(selectExp);
                        const keySelector = expression.Params[0] as FunctionExpression<TType, TResult>;
                        this.parameters.add(keySelector.Params[0].name, expression.ObjectOperand.type);
                        const resultExp: FunctionExpression<TType, TResult> = this.visit(keySelector, param);
                        const selectExpression = resultExp.Body;
                        this.parameters.remove(keySelector.Params[0].name);

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
                            groupExpression.groupBy = Object.keys(selectExpression.Object).select(
                                (o) => selectExpression.Object[o] instanceof ColumnExpression ? selectExpression.Object[o] : new ComputedColumnExpression(selectExp.entity, selectExpression.Object[o], this.newAlias("column"))
                            ).toArray();
                        }
                        param.parent = groupExpression;
                        return resultExp;
                    }
                case "toArray":
                    {
                        return expression.ObjectOperand;
                    }
                // TODO
                case "all":
                case "any":
                case "first":
                case "last":
                case "count":
                case "sum":
                case "avg":
                case "max":
                case "min":
                case "contain":
                    break;
                case "except":
                case "fullJoin":
                case "innerJoin":
                case "intersect":
                case "leftJoin":
                case "pivot":
                case "rightJoin":
                case "union":
                    throw new Error(`{expression.MethodName} not supported on expression`);
            }
        }
        expression.Params = expression.Params.select((o) => this.visit(o, param)).toArray();
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
