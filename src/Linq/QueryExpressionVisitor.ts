import "./StringExtension";
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
    TernaryExpression, MultiplicationExpression, TypeofExpression, ValueExpression
} from "../ExpressionBuilder/Expression";
import { ModulusExpression } from "../ExpressionBuilder/Expression/ModulusExpression";
import { TransformerParameter } from "../ExpressionBuilder/TransformerParameter";
import { isValueType, isNativeFunction } from "../Helper/Util";
import { IEntityMetaData, IRelationMetaData } from "../MetaData/Interface/index";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "./Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "./Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "./Queryable/QueryExpression/IColumnExpression";
import {
    ColumnExpression, ComputedColumnExpression, ExceptExpression,
    IEntityExpression, IntersectExpression, ProjectionEntityExpression, UnionExpression, IOrderExpression
} from "./Queryable/QueryExpression/index";
import { SelectExpression, IJoinRelation } from "./Queryable/QueryExpression/SelectExpression";
import { GroupedExpression } from "./Queryable/QueryExpression/GroupedExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";

interface IPRelation {
    name: string;
    relationMaps: Map<any, any>;
    child: SelectExpression<any>;
    type: RelationType;
}
export interface IQueryVisitParameter {
    commandExpression: SelectExpression;
    scope?: string;
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
        expression = expression.clone();
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
            case MultiplicationExpression:
                return this.visitBinaryOperator(expression as any as IBinaryOperatorExpression, param);
            case TernaryExpression:
                return this.visitTernaryOperator(expression as TernaryExpression<any>, param);
            case ObjectValueExpression:
                return this.visitObjectLiteral(expression as ObjectValueExpression<any>, param);
            case ArrayValueExpression:
                throw new Error(`literal Array not supported`);
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
        const objectOperand = expression.objectOperand = this.visit(expression.objectOperand, param);
        if (expression.memberName === "prototype" || expression.memberName === "__proto__")
            throw new Error(`property ${expression.memberName} not supported in linq to sql.`);

        switch (objectOperand.type) {
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
        if ((objectOperand instanceof ValueExpression)) {
            switch (objectOperand.value) {
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
        if (objectOperand instanceof SelectExpression && expression.memberName === "length") {
            return this.visit(new MethodCallExpression(objectOperand, "count", []), param);
        }
        if (objectOperand instanceof GroupedExpression) {
            if (expression.memberName === "key") {
                return objectOperand.key;
            }
        }
        else if (objectOperand instanceof EntityExpression || objectOperand instanceof ProjectionEntityExpression) {
            const parentEntity = objectOperand as IEntityExpression;
            const column = parentEntity.columns.first((c) => c.propertyName === expression.memberName);
            if (column) {
                switch (param.scope) {
                    case "include":
                        if (parentEntity.select) {
                            if (!(column instanceof ComputedColumnExpression)) {
                                parentEntity.select.clearDefaultColumns();
                            }
                        }
                        break;
                }
                if (parentEntity.select) {
                    parentEntity.select.selects.add(column);
                }
                return column;
            }
            const relationMeta: IRelationMetaData<any, any> = Reflect.getOwnMetadata(relationMetaKey, objectOperand.type, expression.memberName as string);
            if (relationMeta) {
                const targetType = relationMeta.targetType;
                switch (param.scope) {
                    case "select":
                    case "selectMany":
                        {
                            let child = new SelectExpression(new EntityExpression(targetType, this.newAlias()));
                            if (relationMeta.relationType === RelationType.OneToMany && param.scope === "select") {
                                param.commandExpression.objectType = Array;
                                param.commandExpression.selects = [];

                                param.commandExpression.addInclude(relationMeta.foreignKeyName, child, relationMeta);
                                return child;
                            }
                            else {
                                if (param.commandExpression.where || param.commandExpression.orders.length > 0) {
                                    child.addJoin(param.commandExpression, relationMeta);
                                    child.addWhere(param.commandExpression.where);
                                    child.addOrder(param.commandExpression.orders);
                                }
                                param.commandExpression = child;
                                return relationMeta.relationType === RelationType.OneToMany ? child : child.entity;
                            }
                        }
                    case "include":
                        {
                            let child = new SelectExpression(new EntityExpression(targetType, this.newAlias()));
                            parentEntity.select!.addInclude(expression.memberName as any, child, relationMeta);
                            return relationMeta.relationType === RelationType.OneToMany ? child : child.entity;
                        }
                    default:
                        {
                            let child = new SelectExpression(new EntityExpression(targetType, this.newAlias()));
                            let joinType: JoinType;
                            if (param.scope === "orderBy")
                                joinType = JoinType.LEFT;
                            parentEntity.select!.addJoinRelation(child, relationMeta, joinType);
                            return relationMeta.relationType === RelationType.OneToMany ? child : child.entity;
                        }
                }
            }
        }
        else {
            const resValue = objectOperand instanceof ValueExpression ? objectOperand.execute() : objectOperand;
            if (resValue[expression.memberName])
                return resValue[expression.memberName];
        }

        throw new Error(`${objectOperand.type.name}.${expression.memberName} is invalid or not supported in linq to sql.`);
    }
    protected visitMethod<TType, KProp extends keyof TType, TResult = any>(expression: MethodCallExpression<TType, KProp, TResult>, param: IQueryVisitParameter): IExpression {
        const objectOperand = expression.objectOperand = this.visit(expression.objectOperand, param);
        if (objectOperand instanceof SelectExpression) {
            let selectOperand = objectOperand as SelectExpression;
            switch (expression.methodName) {
                case "select":
                case "selectMany":
                    {
                        if (param.scope === "include")
                            throw new Error(`${param.scope} did not support ${expression.methodName}`);

                        const parentRelation = objectOperand.parentRelation;
                        const selectorFn = expression.params[0] as FunctionExpression<TType, TResult>;
                        const visitParam: IQueryVisitParameter = { commandExpression: selectOperand, scope: objectOperand instanceof GroupedExpression || parentRelation ? "" : expression.methodName };
                        this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam);
                        this.parameters.remove(selectorFn.params[0].name);
                        param.commandExpression = visitParam.commandExpression;

                        if (expression.methodName === "select") {
                            if (selectExp instanceof SelectExpression) {
                                selectOperand = selectExp;
                            }
                            else if ((selectExp as EntityExpression).primaryColumns) {
                                selectOperand = visitParam.commandExpression;
                            }
                            else if (selectExp instanceof ObjectValueExpression) {
                                const newSelects: IColumnExpression[] = [];
                                const joinRelations: Array<IPRelation> = [];
                                for (const prop in selectExp.object) {
                                    const valueExp = selectExp.object[prop];
                                    if (valueExp instanceof ColumnExpression) {
                                        const colClone = valueExp.clone();
                                        colClone.propertyName = prop;
                                        newSelects.add(colClone);
                                    }
                                    else if ((valueExp as IEntityExpression).primaryColumns) {
                                        // o.Order.Outlet.Store
                                        let childEntity = valueExp as IEntityExpression;

                                        if (childEntity.select === selectOperand) {
                                            const cloneSelect = childEntity.select.clone();
                                            childEntity = cloneSelect.entity;
                                            const relationMap = new Map<any, any>();
                                            for (let i = 0; i < selectOperand.entity.primaryColumns.length; i++) {
                                                const pCol = selectOperand.entity.primaryColumns[i];
                                                const cCol = childEntity.primaryColumns[i];
                                                relationMap.set(pCol, cCol);
                                            }
                                            const pr: IPRelation = {
                                                name: prop,
                                                child: cloneSelect,
                                                relationMaps: relationMap,
                                                type: RelationType.OneToOne
                                            };
                                            joinRelations.push(pr);
                                        }
                                        else {
                                            let parentRel = childEntity.select.parentRelation as IJoinRelation<any, any>;
                                            while ((parentRel as any).name === undefined && parentRel.parent !== selectOperand) {
                                                const relationMap = new Map<any, any>();
                                                for (const [sourceCol, targetCol] of parentRel.relations) {
                                                    relationMap.set(targetCol, sourceCol);
                                                }
                                                const nextRel = parentRel.parent.parentRelation as IJoinRelation<any, any>;
                                                parentRel.parent.joins.remove(parentRel);
                                                parentRel.child.addJoinRelation(parentRel.parent, relationMap, JoinType.INNER);
                                                if (!parentRel) break;
                                                parentRel = nextRel;
                                            }
                                            selectOperand.joins.remove(parentRel);
                                            const pr: IPRelation = {
                                                name: prop,
                                                child: valueExp.select,
                                                relationMaps: parentRel.relations,
                                                type: RelationType.OneToOne
                                            };
                                            joinRelations.push(pr);
                                        }
                                    }
                                    else if (valueExp instanceof SelectExpression) {
                                        // o.Order.Outlet.Registers => Register.Outlet.Order
                                        let parentRel = valueExp.parentRelation as IJoinRelation<any, any>;
                                        while ((parentRel as any).name === undefined && parentRel.parent !== selectOperand) {
                                            const relationMap = new Map<any, any>();
                                            for (const [sourceCol, targetCol] of parentRel.relations) {
                                                relationMap.set(targetCol, sourceCol);
                                            }
                                            const nextRel = parentRel.parent.parentRelation as IJoinRelation<any, any>;
                                            parentRel.parent.joins.remove(parentRel);
                                            parentRel.child.addJoinRelation(parentRel.parent, relationMap, JoinType.INNER);
                                            if (!parentRel) break;
                                            parentRel = nextRel;
                                        }

                                        selectOperand.joins.remove(parentRel);
                                        const pr: IPRelation = {
                                            name: prop,
                                            child: valueExp,
                                            relationMaps: parentRel.relations,
                                            type: RelationType.OneToMany
                                        };
                                        joinRelations.push(pr);
                                    }
                                    else {
                                        newSelects.add(new ComputedColumnExpression(valueExp.entity, valueExp, prop));
                                    }
                                }

                                selectOperand.objectType = Object;
                                selectOperand.selects = newSelects;
                                // selectOperand = new SelectExpression(new ProjectionEntityExpression(selectOperand, Object));
                                for (const rel of joinRelations)
                                    selectOperand.addInclude(rel.name, rel.child, rel.relationMaps, rel.type);
                            }
                            else if ((selectExp as IColumnExpression).entity) {
                                const column = selectExp as IColumnExpression;
                                // const objectSelectOperand = new SelectExpression(new ProjectionEntityExpression(selectOperand, column.type));
                                // selectOperand = objectSelectOperand;
                                selectOperand.objectType = column.type;
                                selectOperand.selects = [column];
                            }
                            else {
                                const column = new ComputedColumnExpression(selectOperand.entity, selectExp, this.newAlias("column"));
                                // const objectSelectOperand = new SelectExpression(new ProjectionEntityExpression(selectOperand, column.type));
                                // selectOperand = objectSelectOperand;
                                selectOperand.objectType = column.type;
                                selectOperand.selects = [column];
                            }
                        }
                        else {
                            if (!(selectExp instanceof SelectExpression)) {
                                throw new Error(`Queryable<${objectOperand.type}>.selectMany required selector with array or queryable or enumerable return value.`);
                            }
                            selectOperand = selectExp;
                        }

                        if (parentRelation) {
                            parentRelation.child = selectOperand;
                            selectOperand.parentRelation = parentRelation;
                        }
                        else {
                            param.commandExpression = selectOperand;
                        }

                        return selectOperand;
                    }
                case "where":
                    {
                        const predicateFn = expression.params[0] as FunctionExpression<TType, boolean>;
                        const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "where" };
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
                        const selectors = expression.params as ObjectValueExpression<any>[];
                        const orders: IOrderExpression[] = [];
                        for (const selector of selectors) {
                            const selectorFn = selector.object.selector as FunctionExpression<TType, any>;
                            const direction = selector.object.direction ? selector.object.direction as ValueExpression<OrderDirection> : new ValueExpression(OrderDirection.ASC);
                            const visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: expression.methodName };
                            this.parameters.add(selectorFn.params[0].name, objectOperand.getVisitParam());
                            const selectExp = this.visit(selectorFn, visitParam) as IColumnExpression;
                            this.parameters.remove(selectorFn.params[0].name);

                            if (!isValueType(selectExp.type)) {
                                throw new Error(`Queryable<${objectOperand.type}>.orderBy required select with basic type return value.`);
                            }
                            orders.push({
                                column: selectExp,
                                direction: direction.value
                            });
                        }
                        if (orders.length > 0) {
                            objectOperand.orders = [];
                            objectOperand.addOrder(orders);
                        }
                        return objectOperand;
                    }
                case "groupBy":
                    {
                        // TODO: queryable end with group by. Orders.groupBy(o => o.OrderDate).toArray();
                        if (param.scope === "include")
                            throw new Error(`${param.scope} did not support ${expression.methodName}`);

                        const parentRelation = objectOperand.parentRelation;
                        const selectorFn = expression.params[0] as FunctionExpression<TType, any>;
                        const visitParam: IQueryVisitParameter = { commandExpression: selectOperand, scope: expression.methodName };
                        this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam);
                        this.parameters.remove(selectorFn.params[0].name);
                        param.commandExpression = visitParam.commandExpression;

                        if (selectExp instanceof SelectExpression) {
                            throw new Error(`Queryable<${objectOperand.type}>.groupBy did not support selector with array or queryable or enumerable return value.`);
                        }
                        // selectOperand = visitParam.commandExpression;
                        let groupColumns: IColumnExpression[] = [];
                        if (selectExp instanceof ObjectValueExpression) {
                            for (const prop in selectExp.object) {
                                const valueExp = selectExp.object[prop];
                                if (valueExp instanceof ColumnExpression) {
                                    groupColumns.push(new ColumnExpression(valueExp.entity, prop, valueExp.type, valueExp.isPrimary, valueExp.columnName));
                                }
                                else if (valueExp instanceof ComputedColumnExpression) {
                                    groupColumns.push(new ComputedColumnExpression(valueExp.entity, valueExp.expression, prop));
                                }
                                else if ((valueExp as IEntityExpression).primaryColumns) {
                                    const childEntity = valueExp as IEntityExpression;
                                    if (childEntity.select)
                                        groupColumns = groupColumns.concat(childEntity.select.selects);
                                    else
                                        groupColumns = groupColumns.concat(childEntity.columns);
                                }
                                else if (valueExp instanceof SelectExpression) {
                                    throw new Error(`Queryable<${objectOperand.type}>.groupBy did not support selector with array or queryable or enumerable return value.`);
                                }
                            }
                        }
                        else if ((selectExp as IColumnExpression).entity) {
                            const column = selectExp as IColumnExpression;
                            groupColumns = [column];
                        }
                        else {
                            const column = new ComputedColumnExpression(selectOperand.entity, selectExp, this.newAlias("column"));
                            groupColumns = [column];
                        }

                        selectOperand = new GroupByExpression(selectOperand, groupColumns, selectExp);
                        if (parentRelation) {
                            parentRelation.child = selectOperand;
                            selectOperand.parentRelation = parentRelation;
                        }
                        else {
                            param.commandExpression = selectOperand;
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
                        const parentRelation = objectOperand.parentRelation;
                        if (expression.params.length > 0) {
                            // TODO o.groupBy(o => o.OrderDate).select(o => o.first());
                            // groupBy select first
                            const selectorFn = expression.params[0] as FunctionExpression<TType, any>;
                            let visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: expression.methodName };
                            const groupExp: GroupByExpression = this.visit(new MethodCallExpression(objectOperand, "groupBy", [selectorFn]), visitParam) as any;
                            param.commandExpression = visitParam.commandExpression;

                            const paramExp = new ParameterExpression("og", groupExp.getVisitParam().type);
                            const selectFirstFn = new FunctionExpression(new MethodCallExpression(paramExp, "first", []), [paramExp]);
                            visitParam = { commandExpression: groupExp, scope: expression.methodName } as IQueryVisitParameter;
                            const groupFirstExp: SelectExpression = this.visit(new MethodCallExpression(objectOperand, "select", [selectFirstFn]), visitParam) as any;
                            param.commandExpression = visitParam.commandExpression;
                            if (parentRelation) {
                                parentRelation.child = selectOperand;
                                selectOperand.parentRelation = parentRelation;
                            }
                            else {
                                param.commandExpression = selectOperand;
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
                            let visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: "include" };
                            this.visit(selectorFn, visitParam);
                            this.parameters.remove(selectorFn.params[0].name);
                        }
                        return objectOperand;
                    }
                case "toArray":
                    {
                        return objectOperand;
                    }
                case "count":
                    {
                        if (param.scope === "include")
                            throw new Error(`${param.scope} did not support ${expression.methodName}`);

                        const parentRelation = objectOperand.parentRelation;
                        const column = new ComputedColumnExpression(objectOperand.entity, new MethodCallExpression(objectOperand, expression.methodName, [new ValueExpression("*")], Number), this.newAlias("column"));
                        if (param.commandExpression === selectOperand || !parentRelation) {
                            if (objectOperand instanceof GroupedExpression) {
                                return column.expression;
                            }
                            selectOperand.columns = [column];
                            return column;
                        }
                        else {
                            const colGroups: IColumnExpression[] = [];
                            const keyObject: { [key: string]: IExpression } = {};
                            for (const [, childCol] of parentRelation.relations) {
                                colGroups.add(childCol);
                                keyObject[childCol.propertyName] = childCol;
                            }
                            const key = new ObjectValueExpression(keyObject);
                            const groupExp = new GroupByExpression(selectOperand, colGroups, key);
                            groupExp.selects.add(column);
                            selectOperand = groupExp;
                            if (parentRelation) {
                                parentRelation.child = selectOperand;
                                selectOperand.parentRelation = parentRelation;
                            }
                            else {
                                param.commandExpression = selectOperand;
                            }
                        }
                        return column;
                    }
                case "sum":
                case "avg":
                case "max":
                case "min":
                    {
                        if (param.scope === "include")
                            throw new Error(`${param.scope} did not support ${expression.methodName}`);

                        const parentRelation = objectOperand.parentRelation;
                        if (expression.params.length > 0) {
                            const selectorFn = expression.params[0] as FunctionExpression;
                            this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                            const visitParam: IQueryVisitParameter = { commandExpression: selectOperand, scope: expression.methodName };
                            const selectExpression: SelectExpression = this.visit(new MethodCallExpression(objectOperand, "select", [selectorFn]), visitParam) as any;
                            this.parameters.remove(selectorFn.params[0].name);
                            param.commandExpression = visitParam.commandExpression;

                            if (!isValueType(selectExpression.entity.type))
                                throw new Error(`Queryable<${selectOperand.type.name}> required select with basic type return value.`);

                            selectOperand = selectExpression;
                        }

                        const column = new ComputedColumnExpression(selectOperand.entity, new MethodCallExpression(selectOperand, expression.methodName, [selectOperand.column], Number), this.newAlias("column"));
                        if (param.commandExpression === objectOperand || !parentRelation) {
                            if (parentRelation) {
                                parentRelation.child = selectOperand;
                                selectOperand.parentRelation = parentRelation;
                            }
                            else {
                                param.commandExpression = selectOperand;
                            }

                            if (objectOperand instanceof GroupedExpression) {
                                return column.expression;
                            }
                            selectOperand.columns = [column];
                        }
                        else {
                            const colGroups: IColumnExpression[] = [];
                            const keyObject: { [key: string]: IExpression } = {};
                            for (const [, childCol] of parentRelation.relations) {
                                colGroups.add(childCol);
                                keyObject[childCol.propertyName] = childCol;
                            }
                            const key = new ObjectValueExpression(keyObject);
                            const groupExp = new GroupByExpression(selectOperand, colGroups, key);
                            groupExp.columns.add(column);
                            selectOperand = groupExp;
                            if (parentRelation) {
                                parentRelation.child = selectOperand;
                                selectOperand.parentRelation = parentRelation;
                            }
                            else {
                                param.commandExpression = selectOperand;
                            }
                        }
                        return column;
                    }
                case "all":
                case "any":
                    {
                        if (param.scope === "include")
                            throw new Error(`${param.scope} did not support ${expression.methodName}`);

                        const isAny = expression.methodName === "any";
                        const parentRelation = objectOperand.parentRelation;
                        if (param.commandExpression === objectOperand || !parentRelation) {
                            selectOperand.entity = new EntityExpression(selectOperand.entity.type as any, this.newAlias());
                        }
                        if (!isAny || expression.params.length > 0) {
                            const predicateFn = expression.params[0] as FunctionExpression;
                            const visitParam: IQueryVisitParameter = { commandExpression: selectOperand, scope: expression.methodName };
                            this.visit(new MethodCallExpression(selectOperand, "where", [predicateFn]), visitParam);
                        }
                        const column = new ComputedColumnExpression(selectOperand.entity, new ValueExpression(isAny), this.newAlias("column"));
                        if (param.commandExpression === objectOperand || !objectOperand.parent) {
                            selectOperand.columns = [column];
                            return new MethodCallExpression(selectOperand, expression.methodName, []);
                        }
                        else {
                            const colGroups: IColumnExpression[] = [];
                            for (const [, childCol] of parentRelation.relations) {
                                colGroups.add(childCol);
                            }
                            selectOperand.columns = colGroups;
                            selectOperand.columns.add(column);
                            selectOperand.distinct = true;
                            if (!isAny) {
                                selectOperand.where = new NotExpression(selectOperand.where);
                            }

                            if (param.scope === "where")
                                return isAny ? new EqualExpression(column, new ValueExpression(true)) : new NotEqualExpression(column, new ValueExpression(false));

                            return new TernaryExpression(new (isAny ? EqualExpression : NotEqualExpression)(column, new ValueExpression(isAny)), new ValueExpression(true), new ValueExpression(false));
                        }
                    }
                case "contains":
                    {
                        if (param.scope === "include")
                            throw new Error(`${param.scope} did not support ${expression.methodName}`);

                        const itemExp = expression.params[0];
                        if ((itemExp as IExpression).type && !(itemExp instanceof ValueExpression)) {
                            if ((itemExp as IEntityExpression).primaryColumns && (itemExp as IEntityExpression).primaryColumns.length > 0) {
                                const primaryKeys = (itemExp as IEntityExpression).primaryColumns;
                                const whereExp = primaryKeys.select((o) => {
                                    const parentColumn = selectOperand.entity.columns.first((p) => p.propertyName === o.propertyName);
                                    return new EqualExpression(parentColumn, o);
                                }).toArray().reduce((result: IExpression<boolean>, prev) => result ? new AndExpression(result, prev) : prev);
                                selectOperand.addWhere(whereExp);
                            }
                            else {
                                if (!isValueType(selectOperand.entity.type))
                                    throw new Error(`Expression not supported. the supplied item type not match`);

                                selectOperand.addWhere(new EqualExpression(selectOperand.column, itemExp));
                            }
                        }
                        else {
                            const item = itemExp instanceof ValueExpression ? itemExp.execute() : itemExp;
                            const entityMeta: IEntityMetaData<TType, any> = Reflect.getOwnMetadata(entityMetaKey, item.constructor);
                            if (entityMeta) {
                                const primaryKeys = entityMeta.primaryKeys;
                                const whereExp = primaryKeys.select((o) => {
                                    const parentColumn = selectOperand.entity.columns.first((p) => p.propertyName === o);
                                    return new EqualExpression(parentColumn, new ValueExpression(item[o]));
                                }).toArray().reduce((result: IExpression<boolean>, prev) => result ? new AndExpression(result, prev) : prev);
                                selectOperand.addWhere(whereExp);
                            }
                            else {
                                if (!isValueType(selectOperand.entity.type))
                                    throw new Error(`Expression not supported. the supplied item type not match`);

                                selectOperand.addWhere(new EqualExpression(selectOperand.column, new ValueExpression(item)));
                            }
                        }

                        return this.visit(new MethodCallExpression(selectOperand, "any" as any, []), param);
                    }
                case "first":
                    {
                        if (param.scope === "include")
                            throw new Error(`${param.scope} did not support ${expression.methodName}`);

                        const parentRelation = objectOperand.parentRelation;
                        if (expression.params.length > 0) {
                            const predicateFn = expression.params[0] as FunctionExpression;
                            const visitParam: IQueryVisitParameter = { commandExpression: selectOperand, scope: expression.methodName };
                            this.visit(new MethodCallExpression(selectOperand, "where" as any, [predicateFn]), visitParam);
                            param.commandExpression = visitParam.commandExpression;
                        }
                        if (param.commandExpression === objectOperand) {
                            selectOperand.paging.take = 1;
                        }
                        else {
                            const colGroups: IColumnExpression[] = [];
                            const keyObject: { [key: string]: IExpression } = {};
                            for (const [, childCol] of parentRelation.relations) {
                                colGroups.add(childCol);
                                keyObject[childCol.propertyName] = childCol;
                            }
                            const key = new ObjectValueExpression(keyObject);
                            const groupExp = new GroupByExpression(selectOperand, colGroups, key);
                            const addExp = groupExp.entity.primaryColumns.reduce((result: IExpression<boolean>, prev) => result ? new AndExpression(result, prev) : prev, undefined);
                            groupExp.columns = [new ComputedColumnExpression(groupExp.entity, addExp!, this.newAlias("column"))];

                            const mainColExp = selectOperand.entity.primaryColumns.reduce((result: IExpression<boolean>, prev) => result ? new AndExpression(result, prev) : prev, undefined);
                            selectOperand.addWhere(new MethodCallExpression(groupExp, "contains", [mainColExp]));
                        }
                        return selectOperand.entity;
                    }
                case "innerJoin":
                case "leftJoin":
                case "rightJoin":
                case "fullJoin":
                    {
                        if (param.scope === "include")
                            throw new Error(`${param.scope} did not support ${expression.methodName}`);

                        const parentRelation = objectOperand.parentRelation;
                        const visitParam: IQueryVisitParameter = { commandExpression: selectOperand, scope: "join" };
                        const childSelectOperand: SelectExpression = this.visit(expression.params[0], visitParam) as any;
                        const childVisitParam: IQueryVisitParameter = { commandExpression: childSelectOperand, scope: "join" };

                        const parentKeySelector = expression.params[1] as FunctionExpression;
                        this.parameters.add(parentKeySelector.params[0].name, selectOperand.getVisitParam());
                        let parentKey = this.visit(parentKeySelector, visitParam);
                        this.parameters.remove(parentKeySelector.params[0].name);

                        const childKeySelector = expression.params[2] as FunctionExpression;
                        this.parameters.add(childKeySelector.params[0].name, childSelectOperand.getVisitParam());
                        let childKey = this.visit(childKeySelector, childVisitParam);
                        this.parameters.remove(childKeySelector.params[0].name);

                        let joinRelationMap = new Map<IColumnExpression<any, any>, IColumnExpression<any, any>>();

                        if (parentKey.type !== childKey.type) {
                            throw new Error(`Key type not match`);
                        }
                        else if ((parentKey as IEntityExpression).primaryColumns) {
                            const parentEntity = parentKey as IEntityExpression;
                            const childEntity = childKey as IEntityExpression;
                            for (const parentCol of parentEntity.primaryColumns) {
                                const childCol = childEntity.primaryColumns.first((c) => c.propertyName === parentCol.propertyName);
                                joinRelationMap.set(parentCol, childCol);
                            }
                        }
                        else {
                            if (!(childKey as IColumnExpression).entity)
                                childKey = new ComputedColumnExpression(childSelectOperand.entity, childKey, this.newAlias());
                            if (!(parentKey as IColumnExpression).entity)
                                parentKey = new ComputedColumnExpression(selectOperand.entity, parentKey, this.newAlias());
                            joinRelationMap.set(parentKey as any, childKey as any);
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

                        selectOperand.addJoinRelation(childSelectOperand, joinRelationMap, jointType);

                        const resultVisitParam: IQueryVisitParameter = { commandExpression: selectOperand, scope: "join" };
                        const resultSelector = expression.params[3] as FunctionExpression;
                        this.parameters.add(resultSelector.params[1].name, childSelectOperand.getVisitParam());
                        this.visit(new MethodCallExpression(selectOperand, "select", [resultSelector]), resultVisitParam);
                        this.parameters.remove(resultSelector.params[1].name);
                        if (parentRelation) {
                            parentRelation.child = selectOperand;
                            selectOperand.parentRelation = parentRelation;
                        }
                        else {
                            param.commandExpression = selectOperand;
                        }

                        return selectOperand;
                    }
                case "union":
                case "intersect":
                case "except":
                    {
                        if (param.scope === "include")
                            throw new Error(`${param.scope} did not support ${expression.methodName}`);

                        const parentRelation = objectOperand.parentRelation;
                        const visitParam: IQueryVisitParameter = { commandExpression: selectOperand, scope: expression.methodName };
                        const childSelectOperand: SelectExpression = this.visit(expression.params[0], visitParam) as any;
                        param.commandExpression = visitParam.commandExpression;

                        let entityExp: IEntityExpression;
                        switch (expression.methodName) {
                            case "union":
                                const isUnionAll = expression.params.length <= 1 ? false : expression.params[1].execute();
                                entityExp = new UnionExpression(selectOperand, childSelectOperand, isUnionAll);
                                break;
                            case "intersect":
                                entityExp = new IntersectExpression(selectOperand, childSelectOperand);
                                break;
                            case "except":
                                entityExp = new ExceptExpression(selectOperand, childSelectOperand);
                                break;
                        }
                        selectOperand = new SelectExpression(entityExp);
                        if (parentRelation) {
                            parentRelation.child = selectOperand;
                            selectOperand.parentRelation = parentRelation;
                        }
                        else {
                            param.commandExpression = selectOperand;
                        }
                        return selectOperand;
                    }
                case "pivot":
                    {
                        if (param.scope === "include")
                            throw new Error(`${param.scope} did not support ${expression.methodName}`);

                        const parentRelation = objectOperand.parentRelation;

                        const dimensions = expression.params[0] as FunctionExpression<TType, any>;
                        const metrics = expression.params[1] as FunctionExpression<TType, any>;

                        // groupby
                        let visitParam: IQueryVisitParameter = { commandExpression: objectOperand, scope: expression.methodName };
                        const groupExp: GroupByExpression = this.visit(new MethodCallExpression(objectOperand, "groupBy", [dimensions]), visitParam) as any;
                        param.commandExpression = visitParam.commandExpression;

                        const dObject = (dimensions.body as ObjectValueExpression<any>).object;
                        const mObject = (metrics.body as ObjectValueExpression<any>).object;
                        const dmObject: { [key: string]: IExpression } = {};
                        for (const prop in dObject)
                            dmObject[prop] = dObject[prop];
                        for (const prop in mObject)
                            dmObject[prop] = dObject[prop];

                        // select
                        const selectorFn = new FunctionExpression(new ObjectValueExpression(dmObject), metrics.params);
                        this.parameters.add(dimensions.params[0].name, groupExp.key);
                        this.parameters.add(selectorFn.params[0].name, groupExp.getVisitParam());
                        visitParam = { commandExpression: groupExp, scope: expression.methodName };
                        const selectExpression: SelectExpression = this.visit(new MethodCallExpression(groupExp, "select", [selectorFn]), visitParam) as any;
                        this.parameters.remove(selectorFn.params[0].name);
                        this.parameters.remove(dimensions.params[0].name);
                        param.commandExpression = visitParam.commandExpression;
                        selectOperand = selectExpression;

                        if (parentRelation) {
                            parentRelation.child = selectOperand;
                            selectOperand.parentRelation = parentRelation;
                        }
                        else {
                            param.commandExpression = selectOperand;
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
        else if (objectOperand.type as any === String) {
            switch (expression.methodName) {
                case "like":
                    return expression;
            }
        }

        const methodFn: () => any = objectOperand.type.prototype[expression.methodName];
        if (methodFn) {
            if (isNativeFunction(methodFn))
                return expression;
            const methodExp = ExpressionBuilder.parse(methodFn, [objectOperand.type]);
            return this.visitFunction(methodExp, param);
        }

        throw new Error(`${expression.methodName} not supported.`);
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
        const objectValue: any = {};
        for (const prop in expression.object) {
            objectValue[prop] = this.visit(expression.object[prop], { commandExpression: param.commandExpression });
        }
        expression.object = objectValue;
        return expression;
    }
}
