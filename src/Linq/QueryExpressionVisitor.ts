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
    TernaryExpression, TimesExpression, TypeofExpression, ValueExpression
} from "../ExpressionBuilder/Expression";
import { ModulusExpression } from "../ExpressionBuilder/Expression/ModulusExpression";
import { ExpressionFactory } from "../ExpressionBuilder/ExpressionFactory";
import { TransformerParameter } from "../ExpressionBuilder/TransformerParameter";
import { isValueType, isNativeFunction } from "../Helper/Util";
import { IEntityMetaData, IRelationMetaData } from "../MetaData/Interface/index";
import { MasterRelationMetaData } from "../MetaData/Relation/index";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "./Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "./Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "./Queryable/QueryExpression/IColumnExpression";
import {
    ColumnExpression, ComputedColumnExpression, ExceptExpression,
    IEntityExpression, IJoinRelationMap, IntersectExpression, ProjectionEntityExpression, UnionExpression
} from "./Queryable/QueryExpression/index";
import "./Queryable/QueryExpression/JoinEntityExpression.partial";
import { SelectExpression } from "./Queryable/QueryExpression/SelectExpression";
import { SingleSelectExpression } from "./Queryable/QueryExpression/SingleSelectExpression";
import { GroupedExpression } from "./Queryable/QueryExpression/GroupedExpression";

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
        if (res instanceof GroupedExpression) {
            if (expression.memberName === "key") {
                return res.key;
            }
        }
        else if (res instanceof EntityExpression || res instanceof ProjectionEntityExpression) {
            const column = res.columns.first((c) => c.property === expression.memberName);
            if (column)
                return column;
            const parentEntity = res as IEntityExpression;
            const relationMeta: IRelationMetaData<any, any> = Reflect.getOwnMetadata(relationMetaKey, res.type, expression.memberName as string);
            if (relationMeta) {
                const targetType = relationMeta instanceof MasterRelationMetaData ? relationMeta.slaveType! : relationMeta.masterType!;
                switch (param.type) {
                    case "select":
                    case "selectMany":
                        {
                            if (relationMeta.relationType === RelationType.OneToMany && param.type === "select") {
                                let child: IEntityExpression = new EntityExpression(targetType, this.newAlias());
                                child = parentEntity.addRelation(child, relationMeta, "[]", JoinType.LEFT);
                                const selectExp = new SelectExpression(new ProjectionEntityExpression(param.parent, param.parent.entity.alias, Array));
                                selectExp.columns = selectExp.entity.primaryColumns.select((c) => {
                                    // TODO : consider use ProjectionColumnExpression ??
                                    c.isShadow = true;
                                    return c;
                                }).toArray();
                                selectExp.columns = selectExp.columns.concat(child.columns);
                                param.parent = selectExp;
                                return (child as ProjectionEntityExpression).select;
                            }
                            else {
                                const entity = new EntityExpression(targetType, this.newAlias());
                                if (param.parent.where || param.parent.orders.length > 0) {
                                    entity.addRelation(param.parent.entity, relationMeta, "");
                                    param.parent.entity = entity;
                                    param.parent.columns = entity.columns.slice();
                                }
                                else {
                                    param.parent = new SelectExpression(entity);
                                }
                                return relationMeta.relationType === RelationType.OneToMany ? param.parent : entity;
                            }
                        }
                    default:
                        {
                            let child: IEntityExpression = new EntityExpression(targetType, this.newAlias());
                            child = parentEntity.addRelation(child, relationMeta, expression.memberName as string);
                            if (param.type === "include") {
                                Array.prototype.push.apply(param.parent.columns, child.columns);
                            }
                            return child instanceof ProjectionEntityExpression ? child.select : child;
                        }
                }
            }
        }
        else {
            const resValue = res instanceof ValueExpression ? res.execute() : res;
            if (resValue[expression.memberName])
                return resValue[expression.memberName];
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
                        if (param.type === "include")
                            throw new Error(`${param.type} did not support ${expression.methodName}`);
                        const parent = objectOperand.parent;
                        const selectorFn = expression.params[0] as FunctionExpression<TType, TResult>;
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: objectOperand instanceof GroupedExpression || parent ? "" : expression.methodName };
                        this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam);
                        this.parameters.remove(selectorFn.params[0].name);
                        param.parent = visitParam.parent;

                        if (expression.methodName === "select") {
                            if (selectExp instanceof SelectExpression) {
                                selectOperand = visitParam.parent;
                            }
                            else if ((selectExp as EntityExpression).primaryColumns) {
                                selectOperand = visitParam.parent;
                            }
                            else if (selectExp instanceof ObjectValueExpression) {
                                let requireKeyProperty = false;
                                const relationMap: Map<string, IEntityExpression> = new Map();
                                selectOperand.columns = Object.keys(selectExp.object).select(
                                    (o) => {
                                        const exp = selectExp.object[o];
                                        if (exp instanceof ColumnExpression) {
                                            return [new ColumnExpression(exp.entity, exp.property, exp.isPrimary, o)];
                                        }
                                        else if (exp instanceof ComputedColumnExpression) {
                                            return [new ComputedColumnExpression(exp.entity, exp.expression, o)];
                                        }
                                        else if (exp instanceof EntityExpression || exp instanceof ProjectionEntityExpression) {
                                            // TODO: make sure this is as expected
                                            // const projEnt = new ProjectionEntityExpression(new SelectExpression(exp), exp.alias, exp.type);
                                            const projEnt = exp;
                                            relationMap.set(o, projEnt);
                                            return projEnt.columns.slice();
                                        }
                                        else if (exp instanceof SelectExpression) {
                                            requireKeyProperty = true;
                                            let res = exp.columns.slice();
                                            // TODO: maybe should use projectionEntity
                                            relationMap.set(o, exp.entity);
                                            if (exp instanceof GroupByExpression) {
                                                res = res.concat(exp.groupBy);
                                                if ((exp.select.key as IColumnExpression).entity) {
                                                    exp.select.key.alias = "key";
                                                }
                                                // else if ((exp.select.key as IEntityExpression).primaryColumns) {
                                                //     relationMap.set(o + "[]" + "", exp.entity);
                                                //     (exp.select.key as IEntityExpression).path = { parent: exp.entity, path: "key" };
                                                // }
                                            }
                                            return res;
                                        }

                                        return [new ComputedColumnExpression(selectOperand.entity, exp, o)];
                                    }
                                ).selectMany((o) => o).toArray();
                                if (requireKeyProperty) {
                                    for (const pcol of selectOperand.entity.primaryColumns) {
                                        pcol.isShadow = true;
                                        if (!selectOperand.columns.contains(pcol)) {
                                            selectOperand.columns.unshift(pcol);
                                        }
                                    }
                                }

                                const objEntity = new ProjectionEntityExpression(selectOperand, this.newAlias(), Object);
                                // Set map for projectionEntity to make sure parsing to object correct.
                                for (const [key, child] of relationMap) {
                                    objEntity.addRelation(child, [], key);
                                }
                                selectOperand = new SelectExpression(objEntity);
                            }
                            else if ((selectExp as IColumnExpression).entity) {
                                const column = selectExp as IColumnExpression;
                                selectOperand = visitParam.parent;
                                selectOperand.columns = [column];
                                selectOperand = new SingleSelectExpression(selectOperand, column);
                            }
                            else {
                                const column = new ComputedColumnExpression(selectOperand.entity, selectExp, this.newAlias("column"));
                                selectOperand = visitParam.parent;
                                selectOperand.columns = [column];
                                selectOperand = new SingleSelectExpression(selectOperand, column);
                            }
                        }
                        else {
                            if (!(selectExp instanceof SelectExpression)) {
                                throw new Error(`Queryable<${objectOperand.type}>.selectMany required selector with array or queryable or enumerable return value.`);
                            }
                            selectOperand = selectExp;
                        }
                        if (parent) {
                            parent.select = selectOperand;
                            selectOperand.parent = parent;
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
                        // param.parent = visitParam.parent;
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
                        // param.parent = visitParam.parent;

                        if (!isValueType(selectExp.type)) {
                            throw new Error(`Queryable<${objectOperand.type}>.orderBy required select with basic type return value.`);
                        }

                        objectOperand.addOrder(selectExp, direction.execute());
                        return objectOperand;
                    }
                case "groupBy":
                    {
                        if (param.type === "include")
                            throw new Error(`${param.type} did not support ${expression.methodName}`);
                        // TODO: queryable end with group by.
                        const parent = objectOperand.parent;
                        const selectorFn = expression.params[0] as FunctionExpression<TType, any>;
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam);
                        this.parameters.remove(selectorFn.params[0].name);
                        param.parent = visitParam.parent;

                        if (selectExp instanceof SelectExpression) {
                            throw new Error(`Queryable<${objectOperand.type}>.groupBy did not support selector with array or queryable or enumerable return value.`);
                        }
                        selectOperand = visitParam.parent;

                        let groupColumns: IColumnExpression[] = [];
                        let colKey: IColumnExpression | undefined;
                        if (selectExp instanceof ObjectValueExpression) {
                            let requireKeyProperty = false;
                            const relationMap: Map<string, IEntityExpression> = new Map();
                            groupColumns = Object.keys(selectExp.object).select(
                                (o) => {
                                    const exp = selectExp.object[o];
                                    if (exp instanceof ColumnExpression) {
                                        return [new ColumnExpression(exp.entity, exp.property, exp.isPrimary, o)];
                                    }
                                    else if (exp instanceof ComputedColumnExpression) {
                                        return [new ComputedColumnExpression(exp.entity, exp.expression, o)];
                                    }
                                    else if (exp instanceof EntityExpression || exp instanceof ProjectionEntityExpression) {
                                        // TODO: make sure this is as expected
                                        // const projEnt = new ProjectionEntityExpression(new SelectExpression(exp), exp.alias, exp.type);
                                        const projEnt = exp;
                                        relationMap.set(o, projEnt);
                                        return projEnt.columns.slice();
                                    }
                                    else if (exp instanceof SelectExpression) {
                                        requireKeyProperty = true;
                                        let res = exp.columns.slice();
                                        relationMap.set(o, exp.entity);
                                        if (exp instanceof GroupByExpression) {
                                            res = res.concat(exp.groupBy);
                                            if ((exp.select.key as IColumnExpression).entity) {
                                                exp.select.key.alias = "key";
                                            }
                                        }
                                        return res;
                                    }

                                    return [new ComputedColumnExpression(selectOperand.entity, exp, o)];
                                }
                            ).selectMany((o) => o).toArray();
                            if (requireKeyProperty) {
                                for (const pcol of selectOperand.entity.primaryColumns) {
                                    pcol.isShadow = true;
                                    if (!groupColumns.contains(pcol)) {
                                        groupColumns.unshift(pcol);
                                    }
                                }
                            }
                            const objEntity = new ProjectionEntityExpression(selectOperand, this.newAlias(), Object);
                            // Set map for projectionEntity to make sure parsing to object correct.
                            for (const [key, child] of relationMap) {
                                objEntity.addRelation(child, [], key);
                            }
                            selectOperand = new SelectExpression(objEntity);
                        }
                        else if ((selectExp as IColumnExpression).entity) {
                            const column = selectExp as IColumnExpression;
                            groupColumns = [column];
                            colKey = column;
                        }
                        else {
                            const column = new ComputedColumnExpression(selectOperand.entity, selectExp, this.newAlias("column"));
                            groupColumns = [column];
                            colKey = column;
                        }

                        selectOperand = new GroupByExpression(selectOperand, groupColumns, colKey);
                        if (parent) {
                            parent.select = selectOperand;
                            selectOperand.parent = parent;
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
                        const parent = objectOperand.parent;
                        if (expression.params.length > 0) {
                            // groupBy select first
                            const selectorFn = expression.params[0] as FunctionExpression<TType, any>;
                            let visitParam: IQueryVisitParameter = { parent: objectOperand, type: expression.methodName };
                            const groupExp = this.visit(new MethodCallExpression(objectOperand, "groupBy", [selectorFn]), visitParam) as GroupByExpression;
                            param.parent = visitParam.parent;

                            const paramExp = new ParameterExpression("og", groupExp.getVisitParam().type);
                            const selectFirstFn = new FunctionExpression(new MethodCallExpression(paramExp, "first", []), [paramExp]);
                            visitParam = { parent: groupExp, type: expression.methodName };
                            const groupFirstExp = this.visit(new MethodCallExpression(objectOperand, "select", [selectFirstFn]), visitParam) as SelectExpression;
                            param.parent = visitParam.parent;
                            if (parent) {
                                parent.select = selectOperand;
                                selectOperand.parent = parent;
                            }
                            else {
                                param.parent = selectOperand;
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
                        let isDefaultCleared = false;
                        for (const paramFn of expression.params) {
                            const selectorFn = paramFn as FunctionExpression<TType, TResult>;
                            this.parameters.add(selectorFn.params[0].name, objectOperand.getVisitParam());
                            let visitParam: IQueryVisitParameter = { parent: objectOperand, type: "include" };
                            const selectExpression = this.visit(selectorFn, visitParam);
                            this.parameters.remove(selectorFn.params[0].name);
                            // param.parent = visitParam.parent;

                            if (selectExpression instanceof ComputedColumnExpression) {
                                objectOperand.columns.add(selectExpression);
                            }
                            else if (selectExpression instanceof ColumnExpression) {
                                // ex: orders.includes(o => o.Total) => only column Total will be projected
                                if (!isDefaultCleared) {
                                    for (const col of selectExpression.entity.columns)
                                        objectOperand.columns.remove(col);
                                    isDefaultCleared = true;
                                }
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
                        if (param.type === "include")
                            throw new Error(`${param.type} did not support ${expression.methodName}`);
                        const parent = objectOperand.parent;
                        const column = new ComputedColumnExpression(objectOperand.entity, new MethodCallExpression(objectOperand, expression.methodName, [new ValueExpression("*")], Number), this.newAlias("column"));
                        if (param.parent === selectOperand || !objectOperand.parent) {
                            if (objectOperand instanceof GroupedExpression) {
                                return column.expression;
                            }
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
                            if (parent) {
                                parent.select = selectOperand;
                                selectOperand.parent = parent;
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
                        if (param.type === "include")
                            throw new Error(`${param.type} did not support ${expression.methodName}`);
                        const parent = objectOperand.parent;
                        if (expression.params.length > 0) {
                            const selectorFn = expression.params[0] as FunctionExpression;
                            this.parameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                            const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                            const selectExpression = this.visit(new MethodCallExpression(objectOperand, "select", [selectorFn]), visitParam) as SelectExpression;
                            this.parameters.remove(selectorFn.params[0].name);
                            param.parent = visitParam.parent;
                            if (!(selectExpression instanceof SingleSelectExpression))
                                throw new Error(`Queryable<${selectOperand.type.name}> required select with basic type return value.`);
                            selectOperand = selectExpression;
                        }
                        if (objectOperand.parent) {
                            objectOperand.parent!.select = selectOperand;
                        }
                        else {
                            param.parent = selectOperand;
                        }
                        const column = new ComputedColumnExpression(selectOperand.entity, new MethodCallExpression(selectOperand, expression.methodName, [selectOperand.column], Number), this.newAlias("column"));
                        if (param.parent === objectOperand || !objectOperand.parent) {
                            if (objectOperand instanceof GroupedExpression) {
                                return column.expression;
                            }
                            selectOperand.columns = [column];
                        }
                        else {
                            const relation = selectOperand.parent!.parent!.getChildRelation(selectOperand.parent!);
                            const group = relation.relationMaps.select((o) => o.childColumn).toArray();
                            const groupExp = new GroupByExpression(selectOperand, group);
                            groupExp.columns = groupExp.groupBy.slice();
                            groupExp.columns.add(column);
                            selectOperand = groupExp;
                            if (parent) {
                                parent.select = selectOperand;
                                selectOperand.parent = parent;
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
                        if (param.type === "include")
                            throw new Error(`${param.type} did not support ${expression.methodName}`);
                        const isAny = expression.methodName === "any";
                        if (param.parent === objectOperand || !objectOperand.parent) {
                            selectOperand.entity = new EntityExpression(selectOperand.entity.type, this.newAlias());
                        }
                        if (!isAny || expression.params.length > 0) {
                            const predicateFn = expression.params[0] as FunctionExpression;
                            const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                            this.visit(new MethodCallExpression(selectOperand, "where", [predicateFn]), visitParam);
                            // param.parent = visitParam.parent;
                        }
                        const column = new ComputedColumnExpression(selectOperand.entity, new ValueExpression(isAny), this.newAlias("column"));
                        if (param.parent === objectOperand || !objectOperand.parent) {
                            selectOperand.columns = [column];
                            return new MethodCallExpression(selectOperand, expression.methodName, []);
                        }
                        else {
                            const relation = selectOperand.parent!.parent!.getChildRelation(selectOperand.parent!);
                            selectOperand.columns = relation.relationMaps.select((o) => o.childColumn).toArray();
                            selectOperand.columns.add(column);
                            selectOperand.distinct = true;
                            if (!isAny) {
                                selectOperand.where = new NotExpression(selectOperand.where);
                            }

                            if (param.type === "where")
                                return isAny ? new EqualExpression(column, new ValueExpression(true)) : new NotEqualExpression(column, new ValueExpression(false));

                            return new TernaryExpression(new (isAny ? EqualExpression : NotEqualExpression)(column, new ValueExpression(isAny)), new ValueExpression(true), new ValueExpression(false));
                        }
                    }
                case "contains":
                    {
                        if (param.type === "include")
                            throw new Error(`${param.type} did not support ${expression.methodName}`);
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
                                if (!(selectOperand instanceof SingleSelectExpression)) {
                                    throw new Error(`Expression not supported. the supplied item type not match`);
                                }
                                selectOperand.addWhere(new EqualExpression(selectOperand.column, itemExp));
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
                                if (!(selectOperand instanceof SingleSelectExpression)) {
                                    throw new Error(`Expression not supported. the supplied item type not match`);
                                }
                                selectOperand.addWhere(new EqualExpression(selectOperand.column, new ValueExpression(item)));
                            }
                        }

                        // throw to any.
                        return this.visit(new MethodCallExpression(selectOperand, "any" as any, []), param);
                    }
                case "first":
                    {
                        if (param.type === "include")
                            throw new Error(`${param.type} did not support ${expression.methodName}`);
                        if (expression.params.length > 0) {
                            const predicateFn = expression.params[0] as FunctionExpression;
                            const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                            this.visit(new MethodCallExpression(selectOperand, "where" as any, [predicateFn]), visitParam);
                            param.parent = visitParam.parent;
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
                            groupExp.columns = [new ComputedColumnExpression(groupExp.entity, addExp!, this.newAlias("column"))];

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
                        if (param.type === "include")
                            throw new Error(`${param.type} did not support ${expression.methodName}`);
                        const parent = objectOperand.parent;
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: "join" };
                        const childSelect = this.visit(expression.params[0], visitParam) as SelectExpression;
                        const childVisitParam: IQueryVisitParameter = { parent: childSelect, type: "join" };

                        const parentKeySelector = expression.params[1] as FunctionExpression;
                        this.parameters.add(parentKeySelector.params[0].name, selectOperand.getVisitParam());
                        let parentKey = this.visit(parentKeySelector, visitParam);
                        this.parameters.remove(parentKeySelector.params[0].name);

                        const childKeySelector = expression.params[2] as FunctionExpression;
                        this.parameters.add(childKeySelector.params[0].name, childSelect.getVisitParam());
                        let childKey = this.visit(childKeySelector, childVisitParam);
                        this.parameters.remove(childKeySelector.params[0].name);

                        const joinEntity = selectOperand.entity;
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
                            if (!(childKey as IColumnExpression).entity)
                                childKey = new ComputedColumnExpression(childSelect.entity, childKey, this.newAlias());
                            if (!(parentKey as IColumnExpression).entity)
                                parentKey = new ComputedColumnExpression(selectOperand.entity, parentKey, this.newAlias());
                            relationMap = [{
                                childColumn: childKey as IColumnExpression,
                                parentColumn: parentKey as IColumnExpression
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

                        const childProjectionEntity = new ProjectionEntityExpression(childSelect, childSelect.entity.alias, childSelect.entity.type);
                        joinEntity.addRelation(childProjectionEntity, relationMap, "", jointType);

                        const resultVisitParam: IQueryVisitParameter = { parent: selectOperand, type: "join" };
                        const resultSelector = expression.params[3] as FunctionExpression;
                        this.parameters.add(resultSelector.params[1].name, childSelect.getVisitParam());
                        this.visit(new MethodCallExpression(selectOperand, "select", [resultSelector]), resultVisitParam);
                        this.parameters.remove(resultSelector.params[1].name);
                        if (parent) {
                            parent.select = selectOperand;
                            selectOperand.parent = parent;
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
                        if (param.type === "include")
                            throw new Error(`${param.type} did not support ${expression.methodName}`);
                        const parent = objectOperand.parent;
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        const childSelect = this.visit(expression.params[0], visitParam) as SelectExpression;
                        param.parent = visitParam.parent;

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
                        if (parent) {
                            parent.select = selectOperand;
                            selectOperand.parent = parent;
                        }
                        else {
                            param.parent = selectOperand;
                        }
                        return selectOperand;
                    }
                case "pivot":
                    {
                        if (param.type === "include")
                            throw new Error(`${param.type} did not support ${expression.methodName}`);
                        const parent = objectOperand.parent;
                        const entity = objectOperand.entity;
                        const dimensions = expression.params[0] as ObjectValueExpression<any>;
                        const metrics = expression.params[1] as ObjectValueExpression<any>;
                        const groups: any[] = [];
                        const visitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        // tslint:disable-next-line:forin
                        for (const key in dimensions.object) {
                            this.parameters.add(dimensions.object[key].params[0].name, selectOperand.getVisitParam());
                            const selectExpression = this.visit(dimensions.object[key], visitParam);
                            this.parameters.remove(dimensions.object[key].params[0].name);
                            param.parent = visitParam.parent;
                            let dimensionCol: IColumnExpression;
                            if ((selectExpression as IColumnExpression).entity) {
                                dimensionCol = selectExpression as IColumnExpression;
                                dimensionCol.alias = key;
                            }
                            else {
                                dimensionCol = new ComputedColumnExpression(entity, selectExpression, key);
                            }
                            groups.add(dimensionCol);
                        }
                        selectOperand = new GroupByExpression(selectOperand, groups);
                        selectOperand.columns = groups.slice();
                        const metricVisitParam: IQueryVisitParameter = { parent: selectOperand, type: expression.methodName };
                        // tslint:disable-next-line:forin
                        for (const key in metrics.object) {
                            this.parameters.add(metrics.object[key].params[0].name, selectOperand.getVisitParam());
                            const selectExpression = this.visit(metrics.object[key], metricVisitParam);
                            this.parameters.remove(metrics.object[key].params[0].name);
                            param.parent = visitParam.parent;
                            let metricCol: IColumnExpression;
                            if ((selectExpression as IColumnExpression).entity) {
                                metricCol = selectExpression as IColumnExpression;
                                metricCol.alias = key;
                            }
                            else {
                                metricCol = new ComputedColumnExpression(entity, selectExpression, key);
                            }
                            selectOperand.columns.add(metricCol);
                        }
                        const objEntity = new ProjectionEntityExpression(selectOperand, this.newAlias());
                        selectOperand = new SelectExpression(objEntity);
                        if (parent) {
                            parent.select = selectOperand;
                            selectOperand.parent = parent;
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
            const methodExp = ExpressionFactory.prototype.ToExpression(methodFn, objectOperand.type);
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
        for (const prop in expression.object) {
            expression.object[prop] = this.visit(expression.object[prop], { parent: param.parent });
        }
        return expression;
    }
}
