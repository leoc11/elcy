import { OrderDirection, JoinType, RelationType } from "../Common/Type";
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
import { TransformerParameter } from "../ExpressionBuilder/TransformerParameter";
import { IEntityMetaData, IRelationMetaData } from "../MetaData/Interface/index";
import { MasterRelationMetaData } from "../MetaData/Relation/index";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "./Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "./Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "./Queryable/QueryExpression/IColumnExpression";
import { ColumnExpression, ComputedColumnExpression, IEntityExpression, ProjectionEntityExpression, IJoinRelationMap, UnionExpression, IntersectExpression, ExceptExpression } from "./Queryable/QueryExpression/index";
import { JoinEntityExpression } from "./Queryable/QueryExpression/JoinEntityExpression";
import { SelectExpression } from "./Queryable/QueryExpression/SelectExpression";
import { SqlFunctionCallExpression } from "./Queryable/QueryExpression/SqlFunctionCallExpression";

export interface IQueryVisitParameter {
    parent: SelectExpression;
    type?: "select" | "selectMany" | "where" | "orderBy" | "include" | "groupBy";
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

        if ((res as IEntityExpression).columns && expression.memberName === "length") {
            return new ComputedColumnExpression(res as IEntityExpression, new MethodCallExpression(res, "count", []), this.newAlias());
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
        let parentEntity = res as IEntityExpression;
        const relationMeta: IRelationMetaData<any, any> = Reflect.getOwnMetadata(relationMetaKey, res.type, expression.memberName as string);
        if (relationMeta) {
            switch (param.type) {
                case "where":
                case "orderBy":
                    if (!(parentEntity instanceof JoinEntityExpression)) {
                        const parent = parentEntity.parent;
                        const joinPEntity = new JoinEntityExpression(parentEntity);
                        if (parent) {
                            parent.changeEntity(parentEntity, joinPEntity);
                        }
                        else {
                            param.parent.entity = joinPEntity;
                        }
                        parentEntity = joinPEntity;
                    }

                    return (parentEntity as JoinEntityExpression<any>).addRelation(relationMeta, this.newAlias());
                case "select":
                    {
                        const targetType = relationMeta instanceof MasterRelationMetaData ? relationMeta.slaveType! : relationMeta.masterType!;
                        let entity: IEntityExpression;
                        let selectExp: SelectExpression;
                        if (param.parent.where || param.parent.orders.length > 0 || relationMeta.relationType === RelationType.OneToMany) {
                            const joinEntity = new JoinEntityExpression(new EntityExpression(targetType, this.newAlias()));
                            joinEntity.addRelation(relationMeta, param.parent.entity);
                            entity = joinEntity.parentEntity;
                            selectExp = new SelectExpression(joinEntity);
                            selectExp.where = param.parent.where;
                            selectExp.orders = param.parent.orders;

                            if (relationMeta.relationType === RelationType.OneToMany) {
                                // TODO: this is a helper column so we could make [][] result
                                for (const pcol of param.parent.entity.primaryColumns)
                                    selectExp.columns.unshift(pcol);
                            }
                        }
                        else {
                            entity = new EntityExpression(targetType, this.newAlias());
                            selectExp = new SelectExpression(entity);
                        }
                        param.parent = selectExp;
                        return entity;
                    }
                case "selectMany":
                    {
                        const targetType = relationMeta instanceof MasterRelationMetaData ? relationMeta.slaveType! : relationMeta.masterType!;
                        let entity: IEntityExpression;
                        let selectExp: SelectExpression;
                        if (param.parent.where || param.parent.orders.length > 0) {
                            const joinEntity = new JoinEntityExpression(new EntityExpression(targetType, this.newAlias()));
                            joinEntity.addRelation(relationMeta, param.parent.entity);
                            entity = joinEntity.parentEntity;
                            selectExp = new SelectExpression(joinEntity);
                            selectExp.where = param.parent.where;
                            selectExp.orders = param.parent.orders;
                        }
                        else {
                            entity = new EntityExpression(targetType, this.newAlias());
                            selectExp = new SelectExpression(entity);
                        }
                        param.parent = selectExp;
                        return entity;
                    }
                case "include":
                    {
                        let joinEntity: JoinEntityExpression<any>;
                        if (parentEntity instanceof JoinEntityExpression)
                            joinEntity = parentEntity;
                        else {
                            joinEntity = new JoinEntityExpression(parentEntity);
                            if (parentEntity.parent) {
                                parentEntity.parent.changeEntity(parentEntity, joinEntity);
                            }
                            else {
                                param.parent.entity = joinEntity;
                            }
                        }

                        const targetType = relationMeta instanceof MasterRelationMetaData ? relationMeta.slaveType! : relationMeta.masterType!;
                        const entity = new EntityExpression(targetType, this.newAlias());
                        joinEntity.addRelation(relationMeta, entity);
                        param.parent.columns = param.parent.columns.concat(entity.columns);
                        return entity;
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
        expression.objectOperand = this.visit(expression.objectOperand, param);
        if ((expression.objectOperand as IEntityExpression).columns) {
            let parentEntity = expression.objectOperand as IEntityExpression;
            const param1: IQueryVisitParameter = { parent: param.parent };
            if (parentEntity.parent && parentEntity.parent.parentEntity !== parentEntity) {
                let projectionEntity: ProjectionEntityExpression;
                if (parentEntity.constructor === ProjectionEntityExpression)
                    projectionEntity = parentEntity as ProjectionEntityExpression;
                else {
                    projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                    if (parentEntity.parent) {
                        parentEntity.parent.changeEntity(parentEntity, projectionEntity);
                    }
                }
                param1.parent = projectionEntity.select;
                parentEntity = projectionEntity;
            }
            switch (expression.methodName) {
                case "where":
                    {
                        param1.type = "where";
                        const fnExpression = expression.params[0] as FunctionExpression<TType, boolean>;
                        this.parameters.add(fnExpression.params[0].name, this.resolveThisArgument(param1.parent, parentEntity));
                        const resExpression = this.visit(fnExpression, param1);
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
                        param1.parent.where = param1.parent.where ? new AndExpression(param1.parent.where, whereExpression!) : whereExpression!;
                        return parentEntity;
                    }
                case "select":
                    {
                        param1.type = "select";
                        const fnExpression = expression.params[0] as FunctionExpression<TType, TResult>;
                        this.parameters.add(fnExpression.params[0].name, this.resolveThisArgument(param1.parent, parentEntity));
                        const selectExpression = this.visit(fnExpression, param1);
                        this.parameters.remove(fnExpression.params[0].name);

                        let selectExp = param1.parent;
                        if ((selectExpression as IColumnExpression).entity) {
                            const colExp = selectExpression as IColumnExpression;
                            colExp.alias = "";
                            selectExp.columns = [colExp];
                        }
                        else if (selectExpression instanceof ObjectValueExpression) {
                            selectExp.columns = Object.keys(selectExpression.object).select(
                                (o) => new ComputedColumnExpression(selectExp.entity, selectExpression.object[o], o)
                            ).toArray();
                        }
                        // else {
                        //     const columnExpression = new ComputedColumnExpression(selectExp.entity, selectExpression, this.newAlias("column"));
                        //     selectExp.columns.add(columnExpression);
                        // }
                        parentEntity = new ProjectionEntityExpression(selectExp, this.newAlias());
                        selectExp = new SelectExpression(parentEntity);
                        if (parentEntity.parent) {
                            const projectionEntity = new ProjectionEntityExpression(selectExp, this.newAlias(), parentEntity.type);
                            parentEntity.parent.changeEntity(parentEntity, projectionEntity);
                            parentEntity = projectionEntity;
                        }
                        else {
                            param.parent = selectExp;
                        }

                        return parentEntity;
                    }
                case "distinct":
                    {
                        if (expression.params.length > 0) {
                            param1.type = "groupBy";
                            parentEntity = this.visit(new MethodCallExpression(parentEntity, "groupBy", expression.params), param1) as ProjectionEntityExpression;
                            const fnExpression = ExpressionFactory.prototype.ToExpression((o: TType[]) => o.first(), Array);
                            parentEntity = this.visit(new MethodCallExpression(parentEntity, "select", [fnExpression]), param1) as ProjectionEntityExpression;
                        }
                        else {
                            param1.parent.distinct = true;
                        }
                        return parentEntity;
                    }
                case "include":
                    {
                        param1.type = "include";
                        for (const selectorfn of expression.params) {
                            const selector = selectorfn as FunctionExpression<TType, TResult>;
                            this.parameters.add(selector.params[0].name, parentEntity);
                            const selectExpression = this.visit(selector, param1);
                            this.parameters.remove(selector.params[0].name);

                            if ((selectExpression as IEntityExpression).columns) {
                                const entityExpression = selectExpression as IEntityExpression;
                                for (const column of entityExpression.columns)
                                    param1.parent.columns.add(column);
                            }
                            else if ((selectExpression as IColumnExpression).entity) {
                                const columnExpression = selectExpression as IColumnExpression;
                                param1.parent.columns.add(columnExpression);
                            }
                        }
                        return parentEntity;
                    }
                case "orderBy":
                    {
                        param1.type = "orderBy";
                        const selector = expression.params[0] as FunctionExpression<TType, boolean>;
                        const direction = expression.params[1] as ValueExpression<OrderDirection>;
                        this.parameters.add(selector.params[0].name, this.resolveThisArgument(param1.parent, parentEntity));
                        const orderByExpression = this.visit(selector, param1);
                        this.parameters.remove(selector.params[0].name);
                        param1.parent.orders.add({ column: orderByExpression, direction: direction.execute() });
                        return parentEntity;
                    }
                case "skip":
                    {
                        const skipExp = expression.params[0] as ValueExpression<number>;
                        param1.parent.paging.skip = skipExp.execute();
                        return parentEntity;
                    }
                case "take":
                    {
                        const takeExp = expression.params[0] as ValueExpression<number>;
                        param1.parent.paging.take = takeExp.execute();
                        return parentEntity;
                    }
                case "selectMany":
                    {
                        param1.type = "selectMany";
                        const selector = expression.params[0] as FunctionExpression<TType, TResult>;
                        this.parameters.add(selector.params[0].name, this.resolveThisArgument(param1.parent, parentEntity));
                        const selectEntity = this.visit(selector, param1) as EntityExpression;
                        this.parameters.remove(selector.params[0].name);

                        if (!(selectEntity as IEntityExpression).columns) {
                            throw Error(`Queryable<${parentEntity.type.name}>.selectMany(${selector.toString()}) did not return entity`);
                        }

                        if (parentEntity.parent) {
                            let projectionEntity: ProjectionEntityExpression;
                            if (parentEntity.constructor === ProjectionEntityExpression)
                                projectionEntity = parentEntity as ProjectionEntityExpression;
                            else {
                                projectionEntity = new ProjectionEntityExpression(param1.parent, this.newAlias(), parentEntity.type);
                                parentEntity.parent.changeEntity(parentEntity, projectionEntity);
                            }
                            parentEntity = projectionEntity;
                        }
                        else if (!parentEntity.parent) {
                            param.parent = param1.parent;
                        }

                        return selectEntity;
                    }
                case "groupBy":
                    {
                        param1.type = "groupBy";
                        const selectExp = param1.parent;
                        const groupExpression = new GroupByExpression<any, any>(new SelectExpression(parentEntity));
                        const keySelector = expression.params[0] as FunctionExpression<TType, TResult>;
                        this.parameters.add(keySelector.params[0].name, this.resolveThisArgument(param1.parent, parentEntity));
                        const selectExpression = this.visit(keySelector, param1);
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
                            const columnExpression = new ComputedColumnExpression(parentEntity, selectExpression, this.newAlias("column"));
                            groupExpression.groupBy.add(columnExpression);
                        }

                        const newProjectionEntity = new ProjectionEntityExpression(groupExpression, this.newAlias(), Object);
                        param.parent.replaceEntity(parentEntity, newProjectionEntity);
                        return newProjectionEntity;
                    }
                case "toArray":
                    {
                        return parentEntity;
                    }
                case "first":
                    {
                        switch (param.type) {
                            case "select":
                            case "selectMany":
                                {
                                    const group = new GroupByExpression(param1.parent);
                                    if (param1.parent.entity instanceof JoinEntityExpression) {
                                        group.groupBy = param1.parent.entity.relations.selectMany((o) => o.relationMaps.select((c) => c.parentColumn)).distinct().toArray();
                                        let addExpression: IExpression | undefined;
                                        for (const pcol of param1.parent.entity.primaryColumns) {
                                            if (addExpression) {
                                                addExpression = new AdditionExpression(addExpression, pcol);
                                            }
                                            else {
                                                addExpression = pcol;
                                            }
                                        }

                                        group.columns.push(new ComputedColumnExpression(param1.parent.entity, new SqlFunctionCallExpression(String, "MIN", [addExpression!]), this.newAlias("column")));
                                        const entity = new EntityExpression(parentEntity.type, this.newAlias());
                                        let addExpression2: IExpression | undefined;
                                        for (const pcol of entity.primaryColumns) {
                                            if (addExpression2) {
                                                addExpression2 = new AdditionExpression(addExpression2, pcol);
                                            }
                                            else {
                                                addExpression2 = pcol;
                                            }
                                        }
                                        const selectExp = new SelectExpression(entity);
                                        selectExp.where = MethodCallExpression.Create<any, "contains", boolean>(group, [addExpression2!], "contains");
                                        param.parent = selectExp;
                                        parentEntity = entity;
                                    }
                                    else {
                                        throw new Error("first in select/selectMany must used again JoinEntityExpression");
                                    }
                                    return parentEntity;
                                }
                            default:
                                {
                                    if (expression.params.length > 0) {
                                        parentEntity = this.visit(new MethodCallExpression(parentEntity, "where", [expression.params[0]]), param1) as ProjectionEntityExpression;
                                    }
                                    const selectExp = param1.parent;
                                    selectExp.paging.take = 1;
                                    return parentEntity;
                                }
                        }
                    }
                case "count":
                    {
                        return new ComputedColumnExpression(parentEntity, new MethodCallExpression(param.parent, expression.methodName, []), this.newAlias("column"));
                    }
                case "sum":
                case "avg":
                case "max":
                case "min":
                    {
                        let columnExp = this.resolveThisArgument(param1.parent, parentEntity);
                        if (expression.params.length > 0) {
                            this.visit(new MethodCallExpression(columnExp, "select", [expression.params[0]]), param1);
                            columnExp = this.resolveThisArgument(param1.parent, parentEntity);
                            param.parent = param1.parent;
                        }
                        if (!(columnExp as IColumnExpression).entity) {
                            throw new Error(`unable find column to ${expression.methodName}`);
                        }
                        return new ComputedColumnExpression(parentEntity, new MethodCallExpression(param.parent, expression.methodName, [columnExp]), this.newAlias("column"));
                    }
                case "all":
                case "any":
                    {
                        if (expression.params.length > 0) {
                            parentEntity = this.visit(new MethodCallExpression(parentEntity, "where", [expression.params[0]]), param1) as ProjectionEntityExpression;
                        }
                        return new ComputedColumnExpression(parentEntity, new MethodCallExpression(parentEntity, expression.methodName, []), this.newAlias("column"));
                    }
                case "contains":
                    {
                        if (param.type) {
                            return expression;
                        }
                        else {
                            const entityMeta: IEntityMetaData<TType, any> = Reflect.getOwnMetadata(entityMetaKey, expression.params[0].type);
                            if (entityMeta) {
                                param1.type = "where";
                                for (const pk of entityMeta.primaryKeys) {
                                    const primaryColumn = parentEntity.columns.first((c) => c.property === pk);
                                    if (!primaryColumn)
                                        throw new Error(`primaryColumn not exist`);
                                    this.visit(new MethodCallExpression(parentEntity, "where", [new EqualExpression(primaryColumn, new MemberAccessExpression(expression.params[0], pk))]), param1);
                                }
                                return new ComputedColumnExpression(parentEntity, new MethodCallExpression(parentEntity, "any", []), this.newAlias("column"));
                            }
                            else if (param1.parent.columns.length === 1) {
                                const wexp = new EqualExpression(param.parent.columns[0], expression.params[0]);
                                param1.parent.where = param1.parent.where ? new AndExpression(param1.parent.where, wexp) : wexp;
                                return parentEntity;
                            }

                            throw new Error(`${expression.methodName} only support entity`);
                        }
                    }
                case "innerJoin":
                case "leftJoin":
                case "rightJoin":
                case "fullJoin":
                    {
                        param1.type = "select";
                        const childSelect = this.visit(expression.params[0], param) as SelectExpression;
                        let childEntity = this.visit(childSelect.entity, param) as IEntityExpression;
                        const param2: IQueryVisitParameter = { parent: new SelectExpression(childEntity), type: "select" };
                        if (childEntity.parent && childEntity.parent.parentEntity !== childEntity) {
                            let projectionEntity: ProjectionEntityExpression;
                            if (childEntity.constructor === ProjectionEntityExpression)
                                projectionEntity = childEntity as ProjectionEntityExpression;
                            else {
                                projectionEntity = new ProjectionEntityExpression(new SelectExpression(childEntity), this.newAlias(), childEntity.type);
                                if (childEntity.parent) {
                                    childEntity.parent.changeEntity(childEntity, projectionEntity);
                                }
                            }
                            param2.parent = projectionEntity.select;
                            childEntity = projectionEntity;
                        }

                        const parentKeySelector = expression.params[1] as FunctionExpression;
                        this.parameters.add(parentKeySelector.params[0].name, this.resolveThisArgument(param1.parent, parentEntity));
                        const parentKey = this.visit(parentKeySelector, param1) as IColumnExpression;
                        this.parameters.remove(parentKeySelector.params[0].name);

                        const childKeySelector = expression.params[2] as FunctionExpression;
                        this.parameters.add(childKeySelector.params[0].name, this.resolveThisArgument(param2.parent, childEntity));
                        const childKey = this.visit(childKeySelector, param2) as IColumnExpression;
                        this.parameters.remove(childKeySelector.params[0].name);

                        let isPassWhere = false;
                        if (param1.parent.columns.any((o) => o instanceof ComputedColumnExpression)) {
                            parentEntity = new ProjectionEntityExpression(param1.parent, this.newAlias());
                        }
                        else {
                            // parentEntity =  param1.parent.entity;
                            if (param1.parent.where)
                                isPassWhere = true;
                        }

                        const joinEntity = new JoinEntityExpression(parentEntity);
                        const selectExp = new SelectExpression(joinEntity);
                        const relationMap: Array<IJoinRelationMap<any, any>> = [];
                        relationMap.push({
                            childColumn: childKey,
                            parentColumn: parentKey
                        });
                        if (isPassWhere) {
                            selectExp.addWhere(param1.parent.where);
                        }

                        isPassWhere = false;
                        if (param2.parent.columns.any((o) => o instanceof ComputedColumnExpression)) {
                            childEntity = new ProjectionEntityExpression(param2.parent, this.newAlias());
                        }
                        else {
                            // childEntity = parent2Expression.entity;
                            if (param2.parent.where)
                                isPassWhere = true;
                        }
                        let jointType: JoinType;
                        switch (expression.methodName) {
                            case "innerJoin":
                                jointType = JoinType.INNER;
                                break;
                            case "leftJoin":
                                jointType = JoinType.LEFT;
                                break;
                            case "rightJoin":
                                jointType = JoinType.RIGHT;
                                break;
                            case "fullJoin":
                                jointType = JoinType.FULL;
                                break;
                        }
                        joinEntity.addRelation(relationMap, childEntity, jointType!);
                        if (isPassWhere) {
                            selectExp.addWhere(param2.parent.where);
                        }

                        const param3: IQueryVisitParameter = { parent: selectExp, type: "select" };
                        const resultSelector = expression.params[3] as FunctionExpression;
                        this.parameters.add(resultSelector.params[1].name, this.resolveThisArgument(param2.parent, childEntity));
                        const entityExp = this.visit(new MethodCallExpression(param3.parent.entity, "select", [resultSelector]), param3);
                        this.parameters.remove(resultSelector.params[1].name);
                        param.parent = param3.parent;
                        return entityExp;
                    }
                case "union":
                    {
                        const select2 = expression.params[0] as SelectExpression;
                        const param2 = { parent: select2 };
                        this.visit(select2, param as any);

                        const isUnionAll = expression.params.length <= 1 ? false : expression.params[1].execute();
                        const unionEntity = new UnionExpression(param.parent, param2.parent, this.newAlias(), isUnionAll);
                        param.parent = new SelectExpression(unionEntity);
                        return unionEntity;
                    }
                case "intersect":
                    {
                        const select2 = expression.params[0] as SelectExpression;
                        const param2 = { parent: select2 };
                        this.visit(select2, param as any);

                        const resEntity = new IntersectExpression(param.parent, param2.parent, this.newAlias());
                        param.parent = new SelectExpression(resEntity);
                        return resEntity;
                    }
                case "except":
                    {
                        const select2 = expression.params[0] as SelectExpression;
                        const param2 = { parent: select2 };
                        this.visit(select2, param as any);

                        const resEntity = new ExceptExpression(param.parent, param2.parent, this.newAlias());
                        param.parent = new SelectExpression(resEntity);
                        return resEntity;
                    }
                case "pivot":
                    {
                        const dimensions = expression.params[0] as ObjectValueExpression<any>;
                        const metrics = expression.params[1] as ObjectValueExpression<any>;
                        const groups: any[] = [];
                        const columns: any[] = [];
                        // tslint:disable-next-line:forin
                        for (const dimensionKey in dimensions.object) {
                            this.parameters.add(dimensions.object[dimensionKey].params[0].name, parentEntity);
                            const nparam: IQueryVisitParameter = { parent: new SelectExpression(param1.parent), type: "where" };
                            const selectExpression = this.visit(dimensions.object[dimensionKey], nparam);
                            param1.parent.entity = nparam.parent.entity;
                            this.parameters.remove(dimensions.object[dimensionKey].params[0].name);
                            groups.add(new ComputedColumnExpression(parentEntity, selectExpression, dimensionKey, dimensionKey));
                        }
                        // tslint:disable-next-line:forin
                        for (const key in metrics.object) {
                            this.parameters.add(metrics.object[key].params[0].name, parentEntity);
                            const nparam: IQueryVisitParameter = { parent: new SelectExpression(param1.parent), type: "where" };
                            const selectExpression = this.visit(metrics.object[key], nparam) as ComputedColumnExpression;
                            param1.parent.entity = nparam.parent.entity;
                            this.parameters.remove(metrics.object[key].params[0].name);
                            selectExpression.alias = selectExpression.property = key;
                            columns.add(selectExpression);
                        }
                        const groupByExpression = new GroupByExpression<any, any>(param1.parent);
                        groupByExpression.columns = groups.concat(columns);
                        groupByExpression.groupBy = groups;
                        param.parent = groupByExpression;
                        return groupByExpression;
                    }
                // case "last":
                // {
                //     let projectionEntity: ProjectionEntityExpression;
                //     if (parentEntity instanceof ProjectionEntityExpression)
                //         projectionEntity = parentEntity;
                //     else {
                //         projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                //         param.parent.replaceEntity(parentEntity, projectionEntity);
                //     }
                //     if (projectionEntity.select.orders.length > 0) {
                //         for (const order of projectionEntity.select.orders) {
                //             order.direction = order.direction === "ASC" ? "DESC" : "ASC";
                //         }
                //     }
                //     // TODO: reverse default order.

                //     return this.visit(new MethodCallExpression(projectionEntity, "first", expression.params), param);
                // }
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
    protected resolveThisArgument<TT>(select: SelectExpression<TT>, entity: IEntityExpression<TT>) {
        return select.columns.length == 1 && select.columns[0].alias === "" ? select.columns[0] : entity;
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
