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
import { ColumnExpression, ComputedColumnExpression, IEntityExpression, ProjectionEntityExpression, IJoinRelationMap } from "./Queryable/QueryExpression/index";
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
                        const joinPEntity = new JoinEntityExpression(parentEntity);
                        if (parentEntity.parent) {
                            parentEntity.parent.changeEntity(parentEntity, joinPEntity);
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
                        if (param.parent.where || param.parent.orders.length > 0) {
                            const joinEntity = new JoinEntityExpression(new EntityExpression(targetType, this.newAlias()));
                            joinEntity.addRelation(relationMeta, param.parent.entity);
                            entity = joinEntity;
                        }
                        else {
                            entity = new EntityExpression(targetType, this.newAlias());
                        }
                        const selectExp = new SelectExpression(entity);
                        selectExp.where = param.parent.where;
                        selectExp.orders = param.parent.orders;
                        if (relationMeta.relationType === RelationType.OneToMany) {
                            // TODO: this is a helper column so we could make [][] result
                            for (const pcol of param.parent.entity.primaryColumns)
                                selectExp.columns.unshift(pcol);
                        }
                        param.parent = selectExp;
                        return entity;
                    }
                case "selectMany":
                    {
                        const targetType = relationMeta instanceof MasterRelationMetaData ? relationMeta.slaveType! : relationMeta.masterType!;
                        let entity: IEntityExpression;
                        if (param.parent.where || param.parent.orders.length > 0) {
                            const joinEntity = new JoinEntityExpression(new EntityExpression(targetType, this.newAlias()));
                            joinEntity.addRelation(relationMeta, param.parent.entity);
                            entity = joinEntity;
                        }
                        else {
                            entity = new EntityExpression(targetType, this.newAlias());
                        }
                        const selectExp = new SelectExpression(entity);
                        selectExp.where = param.parent.where;
                        selectExp.orders = param.parent.orders;
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
            switch (expression.methodName) {
                case "where":
                    {
                        let projectionEntity: ProjectionEntityExpression;
                        if (parentEntity instanceof ProjectionEntityExpression)
                            projectionEntity = parentEntity;
                        else {
                            projectionEntity = new ProjectionEntityExpression(new SelectExpression(parentEntity), this.newAlias(), parentEntity.type);
                            if (parentEntity.parent) {
                                parentEntity.parent.changeEntity(parentEntity, projectionEntity);
                            }
                            else {
                                param.parent.entity = projectionEntity;
                            }
                        }

                        const fnExpression = expression.params[0] as FunctionExpression<TType, boolean>;
                        this.parameters.add(fnExpression.params[0].name, parentEntity);
                        const resExpression = this.visit(fnExpression, { parent: projectionEntity.select, type: expression.methodName });
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
                        const paremSelectExp = parentEntity instanceof ProjectionEntityExpression ? parentEntity.select : new SelectExpression(parentEntity);

                        const fnExpression = expression.params[0] as FunctionExpression<TType, TResult>;
                        this.parameters.add(fnExpression.params[0].name, parentEntity);
                        const nparam = { parent: paremSelectExp, type: expression.methodName };
                        const selectExpression = this.visit(fnExpression, nparam);
                        this.parameters.remove(fnExpression.params[0].name);

                        let selectExp = nparam.parent;
                        if ((selectExpression as IColumnExpression).entity) {
                            selectExp.columns = [selectExpression as IColumnExpression];
                        }
                        else if (selectExpression instanceof ObjectValueExpression) {
                            selectExp.columns = Object.keys(selectExpression.object).select(
                                (o) => new ComputedColumnExpression(selectExp.entity, selectExpression.object[o], o)
                            ).toArray();
                            parentEntity = new ProjectionEntityExpression(selectExp, this.newAlias());
                            selectExp = new SelectExpression(parentEntity);
                        }
                        // else {
                        //     const columnExpression = new ComputedColumnExpression(selectExp.entity, selectExpression, this.newAlias("column"));
                        //     selectExp.columns.add(columnExpression);
                        // }
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
                            this.parameters.add(selector.params[0].name, expression.objectOperand);
                            const selectExpression = this.visit(selector, { parent: projectionEntity.select, type: expression.methodName });
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
                        const direction = expression.params[1] as ValueExpression<OrderDirection>;
                        this.parameters.add(selector.params[0].name, expression.objectOperand);
                        const orderByExpression = this.visit(selector, { parent: projectionEntity.select, type: expression.methodName });
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
                        const paremSelectExp = parentEntity instanceof ProjectionEntityExpression ? parentEntity.select : new SelectExpression(parentEntity);

                        const selector = expression.params[0] as FunctionExpression<TType, TResult>;
                        this.parameters.add(selector.params[0].name, parentEntity);
                        const nparam = { parent: paremSelectExp, type: expression.methodName };
                        const selectExpression = this.visit(selector, nparam);
                        this.parameters.remove(selector.params[0].name);

                        const selectExp = nparam.parent;
                        if (!(selectExpression as IEntityExpression).columns) {
                            throw Error(`Queryable<${parentEntity.type.name}>.selectMany(${selector.toString()}) did not return entity`);
                        }

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
                        this.parameters.add(keySelector.params[0].name, expression.objectOperand);
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
                        switch (param.type) {
                            case "select":
                            case "selectMany":
                                {
                                    const group = new GroupByExpression(param.parent);
                                    if (param.parent.entity instanceof JoinEntityExpression) {
                                        group.groupBy = param.parent.entity.relations.selectMany((o) => o.relationMaps.select((c) => c.parentColumn)).distinct().toArray();
                                        let addExpression: IExpression | undefined;
                                        for (const pcol of param.parent.entity.primaryColumns) {
                                            if (addExpression) {
                                                addExpression = new AdditionExpression(addExpression, pcol);
                                            }
                                            else {
                                                addExpression = pcol;
                                            }
                                        }

                                        group.columns.push(new ComputedColumnExpression(param.parent.entity, new SqlFunctionCallExpression(String, "MIN", [addExpression!]), this.newAlias("column")));
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
                        }
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
                case "contains":
                    {
                        if (param.type) {
                            return expression;
                        }
                        else {
                            const entityMeta: IEntityMetaData<TType, any> = Reflect.getOwnMetadata(entityMetaKey, expression.params[0].type);
                            if (entityMeta) {
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
                            else if (param.parent.columns.length === 1) {
                                const wexp = new EqualExpression(param.parent.columns[0], expression.params[0]);
                                param.parent.where = param.parent.where ? new AndExpression(param.parent.where, wexp) : wexp;
                            }

                            throw new Error(`${expression.methodName} only support entity`);
                        }
                    }
                case "innerJoin":
                case "leftJoin":
                case "rightJoin":
                case "fullJoin":
                    {
                        const parent1Expression = parentEntity instanceof ProjectionEntityExpression ? parentEntity.select : new SelectExpression(parentEntity);
                        let childEntity = this.visit(expression.params[0], param) as IEntityExpression;
                        const parent2Expression = childEntity instanceof ProjectionEntityExpression ? childEntity.select : new SelectExpression(childEntity);

                        const parentKeySelector = expression.params[1] as FunctionExpression;
                        this.parameters.add(parentKeySelector.params[0].name, parent1Expression.entity);
                        const parentKey = this.visit(parentKeySelector, { parent: parent1Expression, type: "select" }) as IColumnExpression;
                        this.parameters.remove(parentKeySelector.params[0].name);

                        const childKeySelector = expression.params[2] as FunctionExpression;
                        this.parameters.add(childKeySelector.params[0].name, parent2Expression.entity);
                        const childKey = this.visit(childKeySelector, { parent: parent2Expression, type: "select" }) as IColumnExpression;
                        this.parameters.remove(childKeySelector.params[0].name);

                        let isPassWhere = false;
                        if (parent1Expression.columns.any((o) => o instanceof ComputedColumnExpression)) {
                            parentEntity = new ProjectionEntityExpression(parent1Expression, this.newAlias());
                        }
                        else {
                            parentEntity = parent1Expression.entity;
                            if (parent1Expression.where)
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
                            selectExp.addWhere(parent1Expression.where);
                        }

                        if (parent1Expression.columns.any((o) => o instanceof ComputedColumnExpression)) {
                            childEntity = new ProjectionEntityExpression(parent2Expression, this.newAlias());
                        }
                        else {
                            isPassWhere = false;
                            childEntity = parent2Expression.entity;
                            if (parent2Expression.where)
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
                            selectExp.addWhere(parent2Expression.where);
                        }

                        const param2 = { parent: new SelectExpression(new ProjectionEntityExpression(selectExp, this.newAlias())), type: "select" };
                        const resultSelector = expression.params[3] as FunctionExpression;
                        this.parameters.add(resultSelector.params[1].name, parent2Expression.entity);
                        const entityExp = this.visit(new MethodCallExpression(param2.parent.entity, "select", [resultSelector]), param2 as any);
                        this.parameters.remove(resultSelector.params[1].name);
                        param.parent = param2.parent;
                        return entityExp;
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
                case "except":
                case "intersect":
                case "pivot":
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
