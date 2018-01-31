import { JoinType, OrderDirection, RelationType } from "../Common/Type";
import { entityMetaKey, relationMetaKey } from "../Decorator/DecoratorKey";
import {
    AdditionExpression, AndExpression, ArrayValueExpression, BitwiseAndExpression,
    BitwiseNotExpression, BitwiseOrExpression, BitwiseSignedRightShiftExpression,
    BitwiseXorExpression, BitwiseZeroLeftShiftExpression, BitwiseZeroRightShiftExpression,
    DivisionExpression, EqualExpression, FunctionCallExpression,
    FunctionExpression, GreaterEqualExpression, GreaterThanExpression, IBinaryOperatorExpression,
    IExpression, InstanceofExpression, IUnaryOperatorExpression,
    LeftDecrementExpression, LeftIncrementExpression, LessEqualExpression, LessThanExpression,
    MemberAccessExpression, MethodCallExpression, NotEqualExpression, NotExpression, ObjectValueExpression,
    OrExpression, ParameterExpression, RightDecrementExpression,
    RightIncrementExpression, StrictEqualExpression, StrictNotEqualExpression, SubtractionExpression,
    TernaryExpression, TimesExpression, TypeofExpression, ValueExpression
} from "../ExpressionBuilder/Expression";
import { ModulusExpression } from "../ExpressionBuilder/Expression/ModulusExpression";
import { ExpressionFactory } from "../ExpressionBuilder/ExpressionFactory";
import { TransformerParameter } from "../ExpressionBuilder/TransformerParameter";
import { isValueType } from "../Helper/Util";
import { IEntityMetaData, IRelationMetaData } from "../MetaData/Interface/index";
import { MasterRelationMetaData } from "../MetaData/Relation/index";
import { NamingStrategy } from "./NamingStrategy";
import { ColumnEntityExpression } from "./Queryable/QueryExpression/ColumnEntityExpression";
import { EntityExpression } from "./Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "./Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "./Queryable/QueryExpression/IColumnExpression";
import {
    ComputedColumnExpression, ExceptExpression, IEntityExpression,
    IJoinRelationMap, IntersectExpression, ProjectionEntityExpression, UnionExpression
} from "./Queryable/QueryExpression/index";
import { JoinEntityExpression } from "./Queryable/QueryExpression/JoinEntityExpression";
import { SelectExpression } from "./Queryable/QueryExpression/SelectExpression";

export interface IQueryVisitParameter {
    parent: SelectExpression;
    type?: string;
}
export class QueryExpressionVisitor {
    public parameters = new TransformerParameter();
    private aliasObj: { [key: string]: number } = {};
    constructor(public namingStrategy: NamingStrategy = new NamingStrategy()) {
    }
    public newAlias(type: "entity" | "column" = "entity") {
        if (!this.aliasObj[type])
            this.aliasObj[type] = 0;
        return this.namingStrategy.getAlias(type) + this.aliasObj[type]++;
    }
    public visit(expression: IExpression, param: IQueryVisitParameter): IExpression {
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
                return this.visitParameter(expression as any, param);
        }
        return expression;
    }
    protected visitParameter<T>(expression: ParameterExpression<T>, param: IQueryVisitParameter) {
        return this.parameters.get(expression.name);
    }
    protected visitFunction<T, TR>(expression: FunctionExpression<T, TR>, param: IQueryVisitParameter) {
        return this.visit(expression.body, param);
    }
    protected visitMember<TType, KProp extends keyof TType>(expression: MemberAccessExpression<TType, KProp>, param: IQueryVisitParameter): IExpression {
        const res = expression.objectOperand = this.visit(expression.objectOperand, param);
        if (expression.memberName === "prototype" || expression.memberName === "__proto__")
            throw new Error(`property ${expression.memberName} not supported in linq to sql.`);

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
        if (res instanceof SelectExpression && expression.memberName === "length") {
            return this.visit(new MethodCallExpression(res, "count", []), param);
        }

        const parentEntity = res as IEntityExpression;
        const relationMeta: IRelationMetaData<any, any> = Reflect.getOwnMetadata(relationMetaKey, res.type, expression.memberName as string);
        if (relationMeta) {
            switch (param.type) {
                case "select":
                case "selectMany":
                    {
                        const targetType = relationMeta instanceof MasterRelationMetaData ? relationMeta.slaveType! : relationMeta.masterType!;
                        if (relationMeta.relationType === RelationType.OneToMany && param.type === "select") {
                            param.parent.columns = param.parent.entity.primaryColumns.slice();
                            let joinEntity: JoinEntityExpression<any>;
                            if (parentEntity.parent && parentEntity.parent.masterEntity === parentEntity) {
                                joinEntity = parentEntity.parent;
                            }
                            else {
                                joinEntity = new JoinEntityExpression(parentEntity);
                                param.parent.entity = joinEntity;
                            }
                            const child = joinEntity.addRelation(relationMeta, this.newAlias()) as ProjectionEntityExpression;
                            return child.select;
                        }
                        else {
                            const entity = new EntityExpression(targetType, this.newAlias());
                            if (param.parent.where || param.parent.orders.length > 0) {
                                const joinEntity = new JoinEntityExpression(entity);
                                joinEntity.addRelation(relationMeta, param.parent.entity);
                                param.parent.entity = joinEntity;
                                param.parent.columns = joinEntity.columns.slice();
                            }
                            else {
                                param.parent = new SelectExpression(entity);
                            }
                            return entity;
                        }
                    }
                default:
                    {
                        let joinEntity: JoinEntityExpression<any>;
                        if (parentEntity.parent && parentEntity.parent.masterEntity === parentEntity) {
                            joinEntity = parentEntity.parent;
                        }
                        else {
                            const parent = parentEntity.parent;
                            joinEntity = new JoinEntityExpression(parentEntity);
                            if (parent) {
                                parent.changeEntity(parentEntity, joinEntity);
                            }
                            else {
                                param.parent.entity = joinEntity;
                            }
                        }

                        const child = (joinEntity as JoinEntityExpression<any>).addRelation(relationMeta, this.newAlias());
                        if (param.type === "include")
                            Array.prototype.push.apply(param.parent.columns, child.columns);
                        return child instanceof ProjectionEntityExpression ? child.select : child;
                    }
            }
        }
        if (parentEntity) {
            const column = parentEntity.columns.first((c) => c.property === expression.memberName);
            if (column)
                return column;
        }
        throw new Error(`property ${expression.memberName} not supported in linq to sql.`);
    }
    protected visitMethod<TType, KProp extends keyof TType, TResult = any>(expression: MethodCallExpression<TType, KProp, TResult>, param: IQueryVisitParameter): IExpression {
        const objectOperand = expression.objectOperand = this.visit(expression.objectOperand, param);
        if (objectOperand instanceof SelectExpression) {
            let selectOperand = objectOperand as SelectExpression;
            switch (expression.methodName) {
                case "select":
                case "selectMany":
                    {
                        const selectorFn = expression.params[0] as FunctionExpression<TType, TResult>;
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam);
                        this.parameters.remove(selectorFn.params[0].name);

                        if (expression.methodName === "select") {
                            if (selectExp instanceof SelectExpression) {
                                selectOperand = visitParam.parent;
                            }
                            else if ((selectExp as EntityExpression).primaryColumns) {
                                selectOperand = visitParam.parent;
                            }
                            else if (selectExp instanceof ObjectValueExpression) {
                                selectOperand.columns = Object.keys(selectExp.object).select(
                                    (o) => new ComputedColumnExpression(selectOperand.entity, selectExp.object[o], o)
                                ).toArray();
                                const objEntity = new ProjectionEntityExpression(selectOperand, this.newAlias());
                                selectOperand = new SelectExpression(objEntity);
                            }
                            else if ((selectExp as IColumnExpression).entity) {
                                const column = selectExp as IColumnExpression;
                                column.alias = ""; // set alias as empty string to mark that this entity next type will be this column type
                                selectOperand = visitParam.parent;
                                selectOperand.columns = [column];
                                selectOperand = new SelectExpression(new ColumnEntityExpression(selectOperand));
                            }
                            else {
                                selectOperand = visitParam.parent;
                                const column = new ComputedColumnExpression(selectOperand.entity, selectExp, "");
                                selectOperand.columns = [column];
                                selectOperand = new SelectExpression(new ColumnEntityExpression(selectOperand));
                            }
                        }
                        else {
                            if (!(selectExp instanceof SelectExpression)) {
                                throw new Error(`Queryable<${objectOperand.type}>.selectMany required selector with array or queryable or enumerable return value.`);
                            }
                            selectOperand = selectExp;
                        }
                        if (objectOperand.parent) {
                            objectOperand.parent.select = selectOperand;
                        }
                        else {
                            param.parent = selectOperand;
                        }

                        return selectOperand;
                    }
                case "where":
                    {
                        const predicateFn = expression.params[0] as FunctionExpression<TType, boolean>;
                        const visitParam: IQueryVisitParameter = { parent: objectOperand, type: "where" };
                        this.parameters.add(predicateFn.params[0].name, objectOperand.getVisitParam());
                        const whereExp = this.visit(predicateFn, visitParam) as IExpression<boolean>;
                        this.parameters.remove(predicateFn.params[0].name);
                        if (whereExp.type !== Boolean) {
                            throw new Error(`Queryable<${objectOperand.type}>.where required predicate with boolean return value.`);
                        }
                        objectOperand.addWhere(whereExp);
                        return objectOperand;
                    }
                case "orderBy":
                    {
                        const selectorFn = expression.params[0] as FunctionExpression<TType, any>;
                        const direction = expression.params[1] as ValueExpression<OrderDirection>;
                        const visitParam: IQueryVisitParameter = { parent: objectOperand, type: expression.methodName };
                        this.parameters.add(selectorFn.params[0].name, objectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam);
                        this.parameters.remove(selectorFn.params[0].name);

                        if (!isValueType(selectExp.type)) {
                            throw new Error(`Queryable<${objectOperand.type}>.orderBy required select with basic type return value.`);
                        }

                        objectOperand.addOrder(selectExp, direction.execute());
                        return objectOperand;
                    }
                case "groupBy":
                    {
                        // TODO: queryable end with group by.
                        const selectorFn = expression.params[0] as FunctionExpression<TType, any>;
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam);
                        this.parameters.remove(selectorFn.params[0].name);

                        if (selectExp instanceof SelectExpression) {
                            throw new Error(`Queryable<${objectOperand.type}>.groupBy did not support selector with array or queryable or enumerable return value.`);
                        }
                        selectOperand = visitParam.parent;

                        let groupColumns: IColumnExpression[] = [];
                        if (selectExp instanceof ObjectValueExpression) {
                            groupColumns = Object.keys(selectExp.object).select(
                                (o) => new ComputedColumnExpression(selectOperand.entity, selectExp.object[o], o)
                            ).toArray();
                        }
                        else if ((selectExp as IColumnExpression).entity) {
                            const column = selectExp as IColumnExpression;
                            column.alias = ""; // set alias as empty string to mark that this entity next type will be this column type
                            groupColumns = [column];
                        }
                        else {
                            groupColumns = [new ComputedColumnExpression(selectOperand.entity, selectExp, this.newAlias("column"))];
                        }

                        selectOperand = new GroupByExpression(selectOperand, groupColumns);
                        if (objectOperand.parent) {
                            objectOperand.parent.select = selectOperand;
                        }
                        else {
                            param.parent = selectOperand;
                        }
                        return selectOperand;
                    }
                case "skip":
                case "take":
                    {
                        const takeExp = expression.params[0] as ValueExpression<number>;
                        objectOperand.paging[expression.methodName] = takeExp.execute();
                        return objectOperand;
                    }
                case "distinct":
                    {
                        if (expression.params.length > 0) {
                            // groupBy select first
                            const selectorFn = expression.params[0] as FunctionExpression<TType, any>;
                            let visitParam: IQueryVisitParameter = { parent: objectOperand, type: expression.methodName };
                            const groupExp = this.visit(new MethodCallExpression(objectOperand, "groupBy", [selectorFn]), visitParam) as GroupByExpression;

                            const paramExp = new ParameterExpression("og", groupExp.getVisitParam().type);
                            const selectFirstFn = new FunctionExpression(new MethodCallExpression(paramExp, "first", []), [paramExp]);
                            visitParam = { parent: groupExp, type: expression.methodName };
                            const groupFirstExp = this.visit(new MethodCallExpression(objectOperand, "select", [selectFirstFn]), visitParam) as SelectExpression;
                            if (objectOperand.parent) {
                                objectOperand.parent.select = groupFirstExp;
                            }
                            else {
                                param.parent = groupFirstExp;
                            }
                            return groupFirstExp;
                        }
                        else {
                            objectOperand.distinct = true;
                            return objectOperand;
                        }
                    }
                case "include":
                    {
                        for (const paramFn of expression.params) {
                            const selectorFn = paramFn as FunctionExpression<TType, TResult>;
                            this.parameters.add(selectorFn.params[0].name, objectOperand.getVisitParam());
                            const visitParam: IQueryVisitParameter = { parent: objectOperand, type: expression.methodName };
                            const selectExpression = this.visit(selectorFn, visitParam);
                            this.parameters.remove(selectorFn.params[0].name);

                            // TODO: place this on member access instead
                            if (selectExpression instanceof ComputedColumnExpression) {
                                objectOperand.columns.add(selectExpression);
                            }
                        }
                        return objectOperand;
                    }
                case "toArray":
                    {
                        return objectOperand;
                    }
                case "count":
                    {
                        const column = new ComputedColumnExpression(objectOperand.entity, new MethodCallExpression(objectOperand, expression.methodName, [new ValueExpression("*")], Number), this.newAlias("column"));
                        if (param.parent === selectOperand) {
                            // must be call from Queryable.count()
                            selectOperand.columns = [column];
                            return column;
                        }
                        else {
                            const relation = selectOperand.parent!.parent!.getChildRelation(selectOperand.parent!);
                            const group = relation.relationMaps.select((o) => o.childColumn).toArray();
                            const groupExp = new GroupByExpression(selectOperand, group);
                            groupExp.columns = groupExp.groupBy.slice();
                            groupExp.columns.add(column);
                            selectOperand = groupExp;
                            if (objectOperand.parent) {
                                objectOperand.parent.select = selectOperand;
                            }
                            else {
                                param.parent = selectOperand;
                            }
                        }
                        return column;
                    }
                case "sum":
                case "avg":
                case "max":
                case "min":
                    {
                        let colEntityExp: ColumnEntityExpression;
                        if (expression.params.length > 0) {
                            const selectorFn = expression.params[0] as FunctionExpression;
                            this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                            const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                            const selectExpression = this.visit(new MethodCallExpression(objectOperand, "select", [selectorFn]), visitParam);
                            this.parameters.remove(selectorFn.params[0].name);
                            if (!(selectExpression instanceof ColumnEntityExpression))
                                throw new Error(`Queryable<${selectOperand.type.name}> required select with basic type return value.`);
                            selectOperand = visitParam.parent;
                            colEntityExp = selectExpression as ColumnEntityExpression;
                        }
                        else {
                            colEntityExp = selectOperand.entity as ColumnEntityExpression;
                        }

                        selectOperand = colEntityExp.select;
                        const column = new ComputedColumnExpression(selectOperand.entity, new MethodCallExpression(selectOperand, expression.methodName, [colEntityExp.column], Number), this.newAlias("column"));
                        if (param.parent === objectOperand || param.type === "select" || param.type === "selectMany") {
                            selectOperand.columns = [column];
                        }
                        else {
                            const relation = selectOperand.parent!.parent!.getChildRelation(selectOperand.parent!);
                            const group = relation.relationMaps.select((o) => o.childColumn).toArray();
                            const groupExp = new GroupByExpression(selectOperand, group);
                            groupExp.columns = groupExp.groupBy.slice();
                            groupExp.columns.add(column);
                            selectOperand = groupExp;
                            if (objectOperand.parent) {
                                objectOperand.parent.select = selectOperand;
                            }
                            else {
                                param.parent = selectOperand;
                            }
                        }
                        return column;
                    }
                case "all":
                case "any":
                    {
                        const isAny = expression.methodName === "any";
                        if (expression.params.length > 0) {
                            const predicateFn = expression.params[0] as FunctionExpression;
                            const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                            this.visit(new MethodCallExpression(selectOperand, "where", [predicateFn]), visitParam);
                        }
                        const column = new ComputedColumnExpression(selectOperand.entity, new ValueExpression(isAny), this.newAlias("column"));
                        if (param.parent === objectOperand || param.type === "select" || param.type === "selectMany") {
                            selectOperand.columns = [column];
                            return column;
                        }
                        else {
                            const relation = selectOperand.parent!.parent!.getChildRelation(selectOperand.parent!);
                            selectOperand.columns = relation.relationMaps.select((o) => o.childColumn).toArray();
                            selectOperand.columns.add(column);
                            selectOperand.distinct = true;
                            if (!isAny) {
                                selectOperand.where = new NotExpression(selectOperand.where);
                            }
                            return new TernaryExpression(new (isAny ? EqualExpression : NotEqualExpression)(column, new ValueExpression(isAny)), new ValueExpression(true), new ValueExpression(false));
                        }
                    }
                case "contains":
                    {
                        const itemExp = expression.params[0];
                        if ((itemExp as IExpression).type && !(itemExp instanceof ValueExpression)) {
                            if ((itemExp as IEntityExpression).primaryColumns && (itemExp as IEntityExpression).primaryColumns.length > 0) {
                                const primaryKeys = (itemExp as IEntityExpression).primaryColumns;
                                const whereExp = primaryKeys.select((o) => {
                                    const parentColumn = selectOperand.entity.columns.first((p) => p.property === o.property);
                                    return new EqualExpression(parentColumn, o);
                                }).toArray().reduce((result: IExpression<boolean>, prev) => result ? new AndExpression(result, prev) : prev);
                                selectOperand.addWhere(whereExp);
                            }
                            else {
                                if (!(selectOperand.entity instanceof ColumnEntityExpression)) {
                                    throw new Error(`Expression not supported. the supplied item type not match`);
                                }
                                selectOperand.addWhere(new EqualExpression(selectOperand.entity.column, itemExp));
                            }
                        }
                        else {
                            const item = itemExp instanceof ValueExpression ? itemExp.execute() : itemExp;
                            const entityMeta: IEntityMetaData<TType, any> = Reflect.getOwnMetadata(entityMetaKey, item.constructor);
                            if (entityMeta) {
                                const primaryKeys = entityMeta.primaryKeys;
                                const whereExp = primaryKeys.select((o) => {
                                    const parentColumn = selectOperand.entity.columns.first((p) => p.property === o);
                                    return new EqualExpression(parentColumn, new ValueExpression(item[o]));
                                }).toArray().reduce((result: IExpression<boolean>, prev) => result ? new AndExpression(result, prev) : prev);
                                selectOperand.addWhere(whereExp);
                            }
                            else {
                                if (!(selectOperand.entity instanceof ColumnEntityExpression)) {
                                    throw new Error(`Expression not supported. the supplied item type not match`);
                                }
                                selectOperand.addWhere(new EqualExpression(selectOperand.entity.column, new ValueExpression(item)));
                            }
                        }

                        // throw to any.
                        return this.visit(new MethodCallExpression(selectOperand, "any" as any, []), param);
                    }
                case "first":
                    {
                        if (expression.params.length > 0) {
                            const predicateFn = expression.params[0] as FunctionExpression;
                            const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                            this.visit(new MethodCallExpression(selectOperand, "where" as any, [predicateFn]), visitParam);
                        }
                        if (param.parent === objectOperand) {
                            selectOperand.paging.take = 1;
                        }
                        else {
                            const relation = selectOperand.parent!.parent!.getChildRelation(selectOperand.parent!);
                            const groups = relation.relationMaps.select((o) => o.parentColumn).distinct().toArray();
                            const groupEntity = new EntityExpression(selectOperand.entity.type, this.newAlias());
                            const groupExp = new GroupByExpression(new SelectExpression(groupEntity), groups);

                            const addExp = groupEntity.primaryColumns.reduce((result: IExpression<boolean>, prev) => result ? new AndExpression(result, prev) : prev, undefined);
                            groupExp.columns = [new ComputedColumnExpression(groupExp.entity, addExp!, this.newAlias())];

                            const mainColExp = selectOperand.entity.primaryColumns.reduce((result: IExpression<boolean>, prev) => result ? new AndExpression(result, prev) : prev, undefined);
                            selectOperand.addWhere(new MethodCallExpression(groupExp, "contains", [mainColExp!]));
                        }
                        return selectOperand.entity;
                    }
                case "innerJoin":
                case "leftJoin":
                case "rightJoin":
                case "fullJoin":
                    {
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: "join" };
                        const childSelect = this.visit(expression.params[0], visitParam) as SelectExpression;
                        const childVisitParam: IQueryVisitParameter = { parent: childSelect, type: "join" };

                        const parentKeySelector = expression.params[1] as FunctionExpression;
                        this.parameters.add(parentKeySelector.params[0].name, selectOperand.getVisitParam());
                        const parentKey = this.visit(parentKeySelector, visitParam);
                        this.parameters.remove(parentKeySelector.params[0].name);

                        const childKeySelector = expression.params[2] as FunctionExpression;
                        this.parameters.add(childKeySelector.params[0].name, childSelect.getVisitParam());
                        const childKey = this.visit(childKeySelector, childVisitParam);
                        this.parameters.remove(childKeySelector.params[0].name);

                        const joinEntity = new JoinEntityExpression(selectOperand.entity);
                        let relationMap: Array<IJoinRelationMap<any, any, any>> = [];

                        if (parentKey.type !== childKey.type) {
                            throw new Error(`Key type not match`);
                        }
                        else if ((parentKey as IEntityExpression).primaryColumns) {
                            const entityPK = parentKey as IEntityExpression;
                            const childPK = childKey as IEntityExpression;
                            relationMap = entityPK.primaryColumns.select((o) => ({
                                childColumn: childPK.primaryColumns.first((c) => c.property === o.property),
                                parentColumn: o
                            })).toArray();
                        }
                        else {
                            relationMap = [{
                                childColumn: childKey,
                                parentColumn: parentKey
                            }];
                        }
                        let jointType: JoinType;
                        switch (expression.methodName) {
                            case "leftJoin":
                                jointType = JoinType.LEFT;
                                break;
                            case "rightJoin":
                                jointType = JoinType.RIGHT;
                                break;
                            case "fullJoin":
                                jointType = JoinType.FULL;
                                break;
                            default:
                                jointType = JoinType.INNER;
                                break;
                        }

                        joinEntity.addRelation(relationMap, childSelect.entity, jointType);
                        selectOperand = new SelectExpression(joinEntity);
                        if (objectOperand.where)
                            selectOperand.addWhere(objectOperand.where);
                        if (childSelect.where)
                            selectOperand.addWhere(childSelect.where);

                        const resultVisitParam: IQueryVisitParameter = { parent: selectOperand, type: "join" };
                        const resultSelector = expression.params[3] as FunctionExpression;
                        this.parameters.add(resultSelector.params[1].name, childSelect.getVisitParam());
                        this.visit(new MethodCallExpression(selectOperand, "select", [resultSelector]), resultVisitParam);
                        this.parameters.remove(resultSelector.params[1].name);

                        if (objectOperand.parent) {
                            objectOperand.parent.select = selectOperand;
                        }
                        else {
                            param.parent = selectOperand;
                        }
                        return selectOperand;
                    }
                case "union":
                case "intersect":
                case "except":
                    {
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        const childSelect = this.visit(expression.params[0], visitParam) as SelectExpression;

                        let entity: IEntityExpression;
                        switch (expression.methodName) {
                            case "union":
                                const isUnionAll = expression.params.length <= 1 ? false : expression.params[1].execute();
                                entity = new UnionExpression(selectOperand, childSelect, this.newAlias(), isUnionAll);
                                break;
                            case "intersect":
                                entity = new IntersectExpression(selectOperand, childSelect, this.newAlias());
                                break;
                            case "except":
                                entity = new ExceptExpression(selectOperand, childSelect, this.newAlias());
                                break;
                        }
                        selectOperand = new SelectExpression(entity!);

                        if (objectOperand.parent) {
                            objectOperand.parent.select = selectOperand;
                        }
                        else {
                            param.parent = selectOperand;
                        }
                        return selectOperand;
                    }
                case "pivot":
                    {
                        const dimensions = expression.params[0] as ObjectValueExpression<any>;
                        const metrics = expression.params[1] as ObjectValueExpression<any>;
                        const groups: any[] = [];
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        // tslint:disable-next-line:forin
                        for (const dimensionKey in dimensions.object) {
                            this.parameters.add(dimensions.object[dimensionKey].params[0].name, selectOperand.getVisitParam());
                            const selectExpression = this.visit(dimensions.object[dimensionKey], visitParam);
                            this.parameters.remove(dimensions.object[dimensionKey].params[0].name);
                            groups.add(new ComputedColumnExpression(selectOperand.entity, selectExpression, dimensionKey));
                        }
                        selectOperand = new GroupByExpression(selectOperand, groups);
                        selectOperand.columns = groups.slice();
                        const metricVisitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        // tslint:disable-next-line:forin
                        for (const key in metrics.object) {
                            this.parameters.add(metrics.object[key].params[0].name, selectOperand.getVisitParam());
                            const selectExpression = this.visit(metrics.object[key], metricVisitParam);
                            this.parameters.remove(metrics.object[key].params[0].name);
                            selectOperand.columns.add(new ComputedColumnExpression(selectOperand.entity, selectExpression, key));
                        }

                        if (objectOperand.parent) {
                            objectOperand.parent.select = selectOperand;
                        }
                        else {
                            param.parent = selectOperand;
                        }
                        return selectOperand;
                    }
                default:
                    throw new Error(`${expression.methodName} not supported on expression`);
            }
        }
        else if (expression.objectOperand instanceof ValueExpression) {
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

        const methodFn: () => any = objectOperand.type.prototype[expression.methodName];
        const methodExp = ExpressionFactory.prototype.ToExpression(methodFn, objectOperand.type);
        return this.visitFunction(methodExp, param);
    }
    protected resolveThisArgument<TT>(select: SelectExpression<TT>, entity: IEntityExpression<TT>) {
        return select.columns.length === 1 && select.columns[0].alias === "" ? select.columns[0] : entity;
    }
    protected visitFunctionCall<T>(expression: FunctionCallExpression<T>, param: IQueryVisitParameter): IExpression {
        expression.params = expression.params.select((o) => this.visit(o, param)).toArray();
        return expression;
    }
    protected visitBinaryOperator(expression: IBinaryOperatorExpression, param: IQueryVisitParameter): IExpression {
        expression.leftOperand = this.visit(expression.leftOperand, param);
        expression.rightOperand = this.visit(expression.rightOperand, param);
        return expression;
    }
    protected visitUnaryOperator(expression: IUnaryOperatorExpression, param: IQueryVisitParameter): IExpression {
        expression.operand = this.visit(expression.operand, param);
        return expression;
    }
    protected visitTernaryOperator(expression: TernaryExpression<any>, param: IQueryVisitParameter): IExpression {
        expression.logicalOperand = this.visit(expression.logicalOperand, param);
        expression.trueResultOperand = this.visit(expression.trueResultOperand, param);
        expression.falseResultOperand = this.visit(expression.falseResultOperand, param);
        return expression;
    }
    protected visitObjectLiteral<T extends { [Key: string]: IExpression } = any>(expression: ObjectValueExpression<T>, param: IQueryVisitParameter) {
        // tslint:disable-next-line:forin
        for (const prop in expression.object) {
            expression.object[prop] = this.visit(expression.object[prop], param);
        }
        return expression;
    }
}
