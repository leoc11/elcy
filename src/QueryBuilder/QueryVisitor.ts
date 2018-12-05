import "../Extensions/StringExtension";
import { JoinType, OrderDirection, RelationshipType, GenericType } from "../Common/Type";
import { relationMetaKey, columnMetaKey } from "../Decorator/DecoratorKey";
import { TransformerParameter } from "../ExpressionBuilder/TransformerParameter";
import { isValueType, isNativeFunction, isValue, replaceExpression, addKeepInMap } from "../Helper/Util";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { GroupedExpression } from "../Queryable/QueryExpression/GroupedExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { InstantiationExpression } from "../ExpressionBuilder/Expression/InstantiationExpression";
import { IMemberOperatorExpression } from "../ExpressionBuilder/Expression/IMemberOperatorExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { ProjectionEntityExpression } from "../Queryable/QueryExpression/ProjectionEntityExpression";
import { ComputedColumnExpression } from "../Queryable/QueryExpression/ComputedColumnExpression";
import { ColumnExpression } from "../Queryable/QueryExpression/ColumnExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { TernaryExpression } from "../ExpressionBuilder/Expression/TernaryExpression";
import { FunctionCallExpression } from "../ExpressionBuilder/Expression/FunctionCallExpression";
import { NotExpression } from "../ExpressionBuilder/Expression/NotExpression";
import { IUnaryOperatorExpression } from "../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../ExpressionBuilder/Expression/EqualExpression";
import { IBinaryOperatorExpression } from "../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { ObjectValueExpression } from "../ExpressionBuilder/Expression/ObjectValueExpression";
import { ArrayValueExpression } from "../ExpressionBuilder/Expression/ArrayValueExpression";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { IEntityExpression } from "../Queryable/QueryExpression/IEntityExpression";
import { IOrderExpression } from "../Queryable/QueryExpression/IOrderExpression";
import { UnionExpression } from "../Queryable/QueryExpression/UnionExpression";
import { IntersectExpression } from "../Queryable/QueryExpression/IntersectExpression";
import { ExceptExpression } from "../Queryable/QueryExpression/ExceptExpression";
import { ComputedColumnMetaData } from "../MetaData/ComputedColumnMetaData";
import { EmbeddedRelationMetaData } from "../MetaData/EmbeddedColumnMetaData";
import { ValueExpressionTransformer } from "../ExpressionBuilder/ValueExpressionTransformer";
import { SubtractionExpression } from "../ExpressionBuilder/Expression/SubtractionExpression";
import { AdditionExpression } from "../ExpressionBuilder/Expression/AdditionExpression";
import { SqlParameterExpression } from "../ExpressionBuilder/Expression/SqlParameterExpression";
import { QueryTranslator } from "./QueryTranslator/QueryTranslator";
import { NamingStrategy } from "./NamingStrategy";
import { Queryable } from "../Queryable/Queryable";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "../ExpressionBuilder/Expression/StrictNotEqualExpression";
import { QueryBuilderError, QueryBuilderErrorCode } from "../Error/QueryBuilderError";
import { ISelectQueryOption } from "./Interface/IQueryOption";
import { CustomEntityExpression } from "../Queryable/QueryExpression/CustomEntityExpression";
import { GreaterThanExpression } from "../ExpressionBuilder/Expression/GreaterThanExpression";
import { LessThanExpression } from "../ExpressionBuilder/Expression/LessThanExpression";
import { OrExpression } from "../ExpressionBuilder/Expression/OrExpression";
import { LessEqualExpression } from "../ExpressionBuilder/Expression/LessEqualExpression";
import { GreaterEqualExpression } from "../ExpressionBuilder/Expression/GreaterEqualExpression";
import { JoinRelation } from "../Queryable/Interface/JoinRelation";
import { IncludeRelation } from "../Queryable/Interface/IncludeRelation";
import { PagingJoinRelation } from "../Queryable/Interface/PagingJoinRelation";
import { Enumerable } from "../Enumerable/Enumerable";
import { IBaseRelationMetaData } from "../MetaData/Interface/IBaseRelationMetaData";

export interface IVisitParameter {
    selectExpression: SelectExpression;
    scope?: string;
}
export class QueryVisitor {
    public options: ISelectQueryOption;
    public scopeParameters = new TransformerParameter();
    private aliasObj: { [key: string]: number } = {};
    constructor(public namingStrategy: NamingStrategy, public translator: QueryTranslator) {
    }
    protected flatParameterStacks: { [key: string]: any } = {};
    protected parameters: { [key: string]: any } = {};
    public readonly sqlParameters: Map<string, SqlParameterExpression> = new Map();
    protected parameterStackIndex: number;
    public valueTransformer: ValueExpressionTransformer;
    public newAlias(type: "entity" | "column" | "param" = "entity") {
        if (!this.aliasObj[type])
            this.aliasObj[type] = 0;
        return this.namingStrategy.getAlias(type) + this.aliasObj[type]++;
    }
    public setParameter(flatParameterStacks: { [key: string]: any }, parameterStackIndex: number, parameter: { [key: string]: any }) {
        this.flatParameterStacks = flatParameterStacks ? flatParameterStacks : {};
        this.parameters = parameter ? parameter : {};
        this.parameterStackIndex = parameterStackIndex;
        this.valueTransformer = new ValueExpressionTransformer(this.flatParameterStacks);
    }
    protected createParamBuilderItem(expression: IExpression, param: IVisitParameter, paramName?: string) {
        let key = this.getParameterExpressionKey(expression);
        let sqlParam = this.sqlParameters.get(key);
        if (!sqlParam) {
            if (!paramName) paramName = this.newAlias("param");
            sqlParam = new SqlParameterExpression(paramName, expression);
            this.sqlParameters.set(key, sqlParam);
        }
        return sqlParam;
    }
    protected getParameterExpressionKey(expression: IExpression) {
        return expression instanceof SqlParameterExpression ? `${expression.valueGetter.toString()}` : `${expression.toString()}`;
    }
    protected extract(expression: IExpression): [IExpression, boolean] {
        if (expression instanceof ParameterExpression) {
            const key = this.getParameterExpressionKey(expression);
            const existing = this.sqlParameters.get(key);
            this.sqlParameters.delete(key);
            return [existing.valueGetter, true];
        }
        return [expression, false];
    }
    protected extractValue(expression: IExpression) {
        if (expression instanceof ParameterExpression) {
            const key = this.getParameterExpressionKey(expression);
            const existing = this.sqlParameters.get(key);
            this.sqlParameters.delete(key);
            const value = existing.execute(this.valueTransformer);
            return new ValueExpression(value);
        }
        return expression;
    }
    protected isSafe(expression: IExpression) {
        if (expression instanceof ParameterExpression) {
            const scopeParam = this.scopeParameters.get(expression.name);
            return typeof scopeParam === "undefined";
        }
        return expression instanceof ValueExpression;
    }

    public setDefaultBehaviour<T>(selectExp: SelectExpression<T>) {
        const entityExp = selectExp.entity;
        if (entityExp.deleteColumn && !(this.options && this.options.includeSoftDeleted)) {
            selectExp.addWhere(new StrictEqualExpression(entityExp.deleteColumn, new ValueExpression(false)));
        }

        if (selectExp.orders.length <= 0 && entityExp.defaultOrders.length > 0) {
            const orderParams = entityExp.defaultOrders
                .select(o => new ArrayValueExpression(o[0] as FunctionExpression, new ValueExpression(o[1] || "ASC")))
                .toArray();
            this.visit(new MethodCallExpression(selectExp, "orderBy", orderParams), { selectExpression: selectExp, scope: "orderBy" });
        }
    }

    //#region visit parameter
    public visit(expression: IExpression, param: IVisitParameter): IExpression {
        if (!(expression instanceof SelectExpression || expression instanceof SqlParameterExpression ||
            expression instanceof FunctionExpression ||
            expression instanceof EntityExpression || expression instanceof ProjectionEntityExpression ||
            expression instanceof ColumnExpression || expression instanceof ComputedColumnExpression)) {
            const findMap = new Map([[param.selectExpression, param.selectExpression]]);
            expression = expression.clone(findMap);
        }
        switch (expression.constructor) {
            case MethodCallExpression:
            case MemberAccessExpression: {
                const memberExpression = expression as IMemberOperatorExpression<any>;
                memberExpression.objectOperand = this.visit(memberExpression.objectOperand, param);
                if (memberExpression.objectOperand instanceof TernaryExpression) {
                    const ternaryExp = memberExpression.objectOperand as TernaryExpression<any, any>;
                    const trueOperand = memberExpression.clone();
                    trueOperand.objectOperand = ternaryExp.trueResultOperand;
                    const falseOperand = memberExpression.clone();
                    falseOperand.objectOperand = ternaryExp.falseResultOperand;
                    return new TernaryExpression(ternaryExp.logicalOperand, this.visit(trueOperand, param), this.visit(falseOperand, param));
                }
                return expression instanceof MemberAccessExpression ? this.visitMember(expression as any, param) : this.visitMethod(expression as any, param);
            }
            case FunctionCallExpression:
                return this.visitFunctionCall(expression as any, param);
            case InstantiationExpression:
                return this.visitInstantiation(expression as any, param);
            case TernaryExpression:
                return this.visitTernaryOperator(expression as any, param);
            case ObjectValueExpression:
                return this.visitObjectLiteral(expression as ObjectValueExpression<any>, param);
            case ArrayValueExpression:
                throw new Error(`literal Array not supported`);
            case FunctionExpression:
                return this.visitFunction(expression as FunctionExpression, param);
            case ParameterExpression:
                return this.visitParameter(expression as any, param);
            default: {
                if ((expression as IBinaryOperatorExpression).leftOperand) {
                    return this.visitBinaryOperator(expression as any, param);
                }
                else if ((expression as IUnaryOperatorExpression).operand) {
                    return this.visitUnaryOperator(expression as any, param);
                }
            }
        }
        return expression;
    }
    protected visitParameter<T>(expression: ParameterExpression<T>, param: IVisitParameter) {
        let result = this.scopeParameters.get(expression.name);
        if (!result) {
            const value = this.parameters[expression.name];
            if (value instanceof Queryable) {
                const selectExp = value.buildQuery(this) as SelectExpression;
                selectExp.isSubSelect = true;
                param.selectExpression.addJoin(selectExp, null, "LEFT");
                return selectExp;
            }
            else if (value instanceof Function) {
                return ValueExpression.create(value);
            }
            else if (value instanceof Array) {
                const paramExp = new ParameterExpression(this.parameterStackIndex + ":" + expression.name, expression.type);
                paramExp.itemType = expression.itemType;
                const sqlParameterExp = this.createParamBuilderItem(paramExp, param, expression.name);
                const arrayValue = value as any[];

                let arrayItemType = arrayValue[Symbol.arrayItemType];
                const isTypeSpecified = !!arrayItemType;
                if (!arrayItemType) {
                    arrayItemType = arrayValue.where(o => !!o).first();
                }
                const itemType = arrayItemType ? arrayItemType.constructor : Object;

                const entityExp = new CustomEntityExpression("#" + expression.name + this.parameterStackIndex, [], itemType, this.newAlias());
                entityExp.columns.push(new ColumnExpression(entityExp, Number, "__index", "__index", true));

                if (arrayItemType && !isValueType(itemType)) {
                    if (isTypeSpecified) {
                        for (const prop in arrayItemType) {
                            const propValue = arrayItemType[prop];
                            if (isValueType(propValue)) entityExp.columns.push(new ColumnExpression(entityExp, propValue, prop, prop, false));
                        }
                    }
                    else {
                        for (const prop in arrayItemType) {
                            const propValue = arrayItemType[prop];
                            if (propValue === null || (propValue !== undefined && isValue(propValue)))
                                entityExp.columns.push(new ColumnExpression(entityExp, propValue ? propValue.constructor : String, prop, prop, false));
                        }
                    }
                }

                if (entityExp.columns.length === 1)
                    entityExp.columns.push(new ColumnExpression(entityExp, itemType, "__value", "__value", false));

                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = entityExp.columns.where(o => !o.isPrimary).toArray();
                selectExp.isSubSelect = true;
                param.selectExpression.addJoin(selectExp, null, "LEFT");
                sqlParameterExp.select = selectExp;
                return selectExp;
            }

            const paramExp = new ParameterExpression(this.parameterStackIndex + ":" + expression.name, expression.type);
            paramExp.itemType = expression.itemType;
            return this.createParamBuilderItem(paramExp, param);
        }
        else if (result instanceof SelectExpression && !(result instanceof GroupedExpression)) {
            // assumpt all selectExpression parameter come from groupJoin
            const rel = result.parentRelation as JoinRelation;
            const clone = result.clone();
            const replaceMap = new Map<IColumnExpression, IColumnExpression>();
            for (const oriCol of result.entity.columns) {
                replaceMap.set(oriCol, clone.entity.columns.find(o => o.columnName === oriCol.columnName));
            }
            const relations = rel.relations.clone(replaceMap);
            param.selectExpression.addJoin(clone, relations, rel.type);
        }
        return result;
    }
    protected visitFunction<T, TR>(expression: FunctionExpression<TR>, param: IVisitParameter) {
        return this.visit(expression.body, param);
    }
    protected visitMember<T, K extends keyof T>(expression: MemberAccessExpression<T, K>, param: IVisitParameter): IExpression {
        const objectOperand = expression.objectOperand;
        if (expression.memberName === "prototype" || expression.memberName === "__proto__")
            throw new Error(`property ${expression.memberName} not supported in linq to sql.`);

        if (objectOperand instanceof CustomEntityExpression || objectOperand instanceof EntityExpression || objectOperand instanceof ProjectionEntityExpression) {
            const parentEntity = objectOperand as IEntityExpression;
            let column = parentEntity.columns.first((c) => c.propertyName === expression.memberName);
            if (!column && objectOperand instanceof EntityExpression) {
                const computedColumnMeta = Reflect.getOwnMetadata(columnMetaKey, objectOperand.type, expression.memberName as string);
                if (computedColumnMeta instanceof ComputedColumnMetaData) {
                    let paramName: string;
                    if (computedColumnMeta.functionExpression.params.length > 0)
                        paramName = computedColumnMeta.functionExpression.params[0].name;
                    if (paramName)
                        this.scopeParameters.add(paramName, objectOperand);
                    const result = this.visit(computedColumnMeta.functionExpression.clone(), { selectExpression: param.selectExpression });
                    if (paramName)
                        this.scopeParameters.remove(paramName);
                    if (result instanceof EntityExpression || result instanceof SelectExpression)
                        throw new Error(`${objectOperand.type.name}.${expression.memberName} not supported`);

                    column = new ComputedColumnExpression(parentEntity, result, expression.memberName as any);
                }
            }

            if (column) {
                if (param.scope === "project" && parentEntity.select) {
                    parentEntity.select.selects.add(column);
                }
                return column;
            }

            if (parentEntity.select) {
                const selectExp = parentEntity.select;
                let include = selectExp.includes.first((c) => c.name === expression.memberName && c.isEmbedded);
                if (include) {
                    const replaceMap = new Map();
                    const child = include.child.clone(replaceMap);
                    for (const col of selectExp.entity.columns) {
                        const projectedCol = parentEntity.columns.first(o => o.propertyName === col.propertyName);
                        replaceMap.set(col, projectedCol);
                    }
                    const relation = include.relations.clone(replaceMap);

                    switch (param.scope) {
                        case "project":
                        case "include":
                            {
                                selectExp.addInclude(include.name, child, relation, include.type);
                                return include.type === "many" ? child : child.entity;
                            }
                        default:
                            {
                                let joinType: JoinType = "LEFT";
                                if (include.type === "one" && param.scope === "where")
                                    joinType = "INNER";

                                selectExp.addJoin(child, relation, joinType);
                                return include.type === "many" ? child : child.entity;
                            }
                    }
                }
            }

            const relationMeta: IBaseRelationMetaData<T, any> = Reflect.getOwnMetadata(relationMetaKey, objectOperand.type, expression.memberName as string);
            if (relationMeta) {
                const targetType = relationMeta.target.type;
                let entityExp = new EntityExpression(targetType, this.newAlias());

                if (relationMeta instanceof EmbeddedRelationMetaData) {
                    for (const col of entityExp.columns) {
                        col.columnName = relationMeta.prefix + col.columnName;
                    }
                    entityExp.name = objectOperand.name;
                }

                switch (param.scope) {
                    case "project":
                    case "include": {
                        let child = new SelectExpression(entityExp);
                        this.setDefaultBehaviour(child);
                        parentEntity.select!.addInclude(expression.memberName as any, child, relationMeta);
                        return relationMeta.relationType === "many" ? child : child.entity;
                    }
                    default: {
                        let child = new SelectExpression(entityExp);
                        this.setDefaultBehaviour(child);
                        let joinType: JoinType;
                        if (param.scope === "orderBy")
                            joinType = "LEFT";

                        parentEntity.select!.addJoin(child, relationMeta, joinType);
                        return relationMeta.relationType === "many" ? child : child.entity;
                    }
                }
            }
        }
        else if (objectOperand instanceof SelectExpression && expression.memberName === "length") {
            return this.visit(new MethodCallExpression(objectOperand, "count", []), param);
        }
        else if (objectOperand instanceof GroupedExpression) {
            if (expression.memberName === "key") {
                const result = objectOperand.key;
                if ((result as IEntityExpression).primaryColumns && !(result instanceof ProjectionEntityExpression)) {
                    const entityExp = result as IEntityExpression;
                    switch (param.scope) {
                        case "project":
                        case "include":
                        case "select-object": {
                            return result;
                        }
                        default: {
                            const includeRel = entityExp.select.parentRelation as IncludeRelation;
                            const replaceMap = new Map();
                            addKeepInMap(replaceMap, entityExp);
                            const childExp = entityExp.select.clone(replaceMap);

                            for (const parentCol of objectOperand.groupByExp.projectedColumns) {
                                const groupedCol = Enumerable.load(objectOperand.projectedColumns).first(o => o.columnName === parentCol.columnName);
                                replaceMap.set(parentCol, groupedCol);
                            }
                            objectOperand.addJoin(childExp, includeRel.relations.clone(replaceMap), "INNER");
                            return childExp.entity;
                        }
                    }
                }
                return result;
            }
        }
        else if (objectOperand instanceof ParameterExpression) {
            const key = this.getParameterExpressionKey(objectOperand);
            const existing = this.sqlParameters.get(key);
            this.sqlParameters.delete(key);
            expression.objectOperand = existing.valueGetter;
            const result = this.createParamBuilderItem(expression, param);
            return result;
        }
        else if (objectOperand instanceof ObjectValueExpression) {
            throw new Error("NOT NEEDED");
        }
        else {
            const isExpressionSafe = this.isSafe(objectOperand);

            let translator;
            if (objectOperand instanceof ValueExpression) {
                translator = this.translator.resolve(objectOperand.value, expression.memberName as any);
                if (translator && translator.isPreferTranslate(expression, isExpressionSafe)) {
                    return expression;
                }
            }

            if (!translator && objectOperand.type) {
                translator = this.translator.resolve(objectOperand.type.prototype, expression.memberName as any);
                if (translator && translator.isPreferTranslate(expression, isExpressionSafe))
                    return expression;
            }

            // Execute in app if all parameter is available.
            if (isExpressionSafe) {
                let hasParam = false;
                [expression.objectOperand, hasParam] = this.extract(expression.objectOperand);
                if (hasParam) {
                    const result = this.createParamBuilderItem(expression, param);
                    return result;
                }
                return new ValueExpression(expression.execute());
            }
        }

        throw new Error(`${objectOperand.type.name}.${expression.memberName} is invalid or not supported in linq to sql.`);
    }
    protected visitInstantiation<T>(expression: InstantiationExpression<T>, param: IVisitParameter): IExpression {
        const clone = expression.clone();
        expression.typeOperand = this.visit(expression.typeOperand, param);
        expression.params = expression.params.select(o => this.visit(o, param)).toArray();
        const paramExps: ParameterExpression[] = [];
        const isExpressionSafe = this.isSafe(expression.typeOperand) && expression.params.all(o => this.isSafe(o));

        if (expression.typeOperand instanceof ValueExpression) {
            let translator = this.translator.resolve(expression.typeOperand.value);
            if (translator && translator.isPreferTranslate(expression, isExpressionSafe))
                return expression;
        }

        if (isExpressionSafe) {
            paramExps.forEach(o => {
                const key = this.getParameterExpressionKey(expression);
                const existing = this.sqlParameters.get(key);
                if (existing)
                    this.sqlParameters.delete(key);
            });

            const result = this.createParamBuilderItem(clone, param);
            return result;
        }

        throw new Error(`${expression.type.name} not supported.`);
    }
    protected visitMethod<T, K extends keyof T, R = any>(expression: MethodCallExpression<T, K, R>, param: IVisitParameter): IExpression {
        const objectOperand = expression.objectOperand;

        if (objectOperand instanceof SelectExpression) {
            let selectOperand = objectOperand as SelectExpression;
            switch (expression.methodName) {
                case "groupBy": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    const parentRelation = objectOperand.parentRelation;
                    const selectorFn = expression.params[0] as FunctionExpression<R>;
                    const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: expression.methodName };
                    this.scopeParameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                    const selectExp = this.visit(selectorFn, visitParam);
                    this.scopeParameters.remove(selectorFn.params[0].name);
                    param.selectExpression = visitParam.selectExpression;

                    if (selectExp instanceof SelectExpression) {
                        throw new Error(`groupBy did not support selector which return array/queryable/enumerable.`);
                    }

                    let key = selectExp;
                    if ((selectExp as IEntityExpression).primaryColumns) {
                        const entityExp = selectExp as IEntityExpression;
                        const childSelectExp = entityExp.select;
                        if (childSelectExp === selectOperand) {
                            throw new Error(`groupBy did not support selector which return itselft.`);
                        }

                        // remove relation to groupBy expression.
                        const parentRel = childSelectExp.parentRelation as JoinRelation;
                        parentRel.parent.joins.remove(parentRel);
                    }
                    else if ((selectExp as IColumnExpression).entity) {
                        key = selectExp;
                    }
                    else {
                        const column = new ComputedColumnExpression(selectOperand.entity, selectExp, "key");
                        column.alias = this.newAlias("column");
                        key = column;
                    }

                    const groupByExp = new GroupByExpression(selectOperand, key);
                    if (parentRelation) {
                        parentRelation.child = groupByExp;
                        groupByExp.parentRelation = parentRelation;
                    }
                    else {
                        param.selectExpression = groupByExp;
                    }

                    return groupByExp;
                }
                case "select":
                case "selectMany": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    if (selectOperand instanceof GroupByExpression) {
                        selectOperand.isAggregate = true;
                    }

                    // const parentRelation = objectOperand.parentRelation;
                    const selectorFn = (expression.params.length > 1 ? expression.params[1] : expression.params[0]) as FunctionExpression<R>;
                    const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: expression.methodName };
                    this.scopeParameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                    const selectExp = this.visit(selectorFn, visitParam);
                    this.scopeParameters.remove(selectorFn.params[0].name);

                    // clear includes coz select return selected value without it's relations
                    // dont clear includes before visit coz embeddedSelect check include for it's navigation
                    selectOperand.includes = [];

                    const type = expression.params.length > 1 ? expression.params[0] as ValueExpression<GenericType> : null;

                    if (expression.methodName === "select") {
                        if (selectExp instanceof SelectExpression) {
                            if (selectOperand instanceof GroupByExpression)
                                throw new Error(`groupBy did not support to many select result`);

                            // group result by relation to parent.
                            reverseJoin(selectExp, selectOperand);

                            const objExp = new ObjectValueExpression({});
                            const paramExp = new ParameterExpression("o", selectExp.itemType);
                            for (const relCol of selectOperand.parentRelation.parentColumns) {
                                objExp.object[relCol.propertyName] = new MemberAccessExpression(paramExp, relCol.propertyName);
                            }
                            const fnExp = new FunctionExpression(objExp, [paramExp]);
                            const groupByMethodExp = new MethodCallExpression(selectExp, "groupBy", [fnExp]);
                            const groupByExp = this.visit(groupByMethodExp, param) as GroupByExpression;
                            groupByExp.keyRelation = null;
                            selectOperand = groupByExp;
                        }
                        else if ((selectExp as IEntityExpression).primaryColumns) {
                            const entityExp = selectExp as IEntityExpression;
                            selectOperand = entityExp.select;
                            // if child select did not have parent relation, that means that
                            // child select is replacement for current param.selectExpression
                            if (!selectOperand.parentRelation && objectOperand.parentRelation) {
                                const parentRel = objectOperand.parentRelation;
                                selectOperand.parentRelation = parentRel;
                                parentRel.child = selectOperand;
                                const replaceMap = new Map<IExpression, IExpression>([[objectOperand, selectOperand]]);
                                for (const col of objectOperand.relationColumns) {
                                    const projectCol = selectOperand.entity.columns.first(o => o.columnName === col.columnName);
                                    replaceMap.set(col, projectCol);
                                }
                                addKeepInMap(replaceMap, parentRel.parent);
                                parentRel.relations = parentRel.relations.clone(replaceMap);
                            }
                            else {
                                // return child select and add current select expression as a join relation.
                                reverseJoin(selectOperand, objectOperand);
                            }
                            if (type) {
                                selectOperand.itemExpression.type = type.value;
                            }
                        }
                        else if ((selectExp as IColumnExpression).entity) {
                            const column = selectExp as IColumnExpression;
                            if (selectOperand instanceof GroupByExpression && selectOperand.key === column) {
                                selectOperand.itemExpression = column;
                                selectOperand.selects = [column];
                            }
                            else {
                                selectOperand = column.entity.select;
                                if (!(selectOperand instanceof GroupedExpression) || true) {
                                    reverseJoin(selectOperand, objectOperand);
                                }
                                selectOperand.itemExpression = column;
                                selectOperand.selects = [column];
                            }
                        }
                        else if (selectExp instanceof TernaryExpression) {
                            // TODO
                        }
                        else {
                            const column = new ComputedColumnExpression(selectOperand.entity, selectExp, this.newAlias("column"));
                            selectOperand.itemExpression = column;
                            selectOperand.selects = [column];
                        }
                    }
                    else {
                        if (!(selectExp instanceof SelectExpression)) {
                            throw new Error(`Queryable<${objectOperand.itemType.name}>.selectMany required selector with array or queryable or enumerable return value.`);
                        }
                        selectOperand = selectExp;
                        reverseJoin(selectOperand, objectOperand);
                        if (type) {
                            selectOperand.itemExpression.type = type.value;
                        }
                    }

                    param.selectExpression = selectOperand;

                    return selectOperand;
                }
                case "project":
                case "include": {
                    if (expression.methodName === "project") {
                        objectOperand.selects = [];
                    }
                    for (const paramFn of expression.params) {
                        const selectorFn = paramFn as FunctionExpression<R>;
                        this.scopeParameters.add(selectorFn.params[0].name, objectOperand.getVisitParam());
                        let visitParam: IVisitParameter = { selectExpression: objectOperand, scope: expression.methodName };
                        this.visit(selectorFn, visitParam);
                        this.scopeParameters.remove(selectorFn.params[0].name);
                    }
                    return objectOperand;
                }
                case "where": {
                    if (param.scope === "object-select" && selectOperand instanceof GroupedExpression) {
                        const entityExp = selectOperand.entity.clone();
                        entityExp.alias = this.newAlias();
                        const selectExp = new SelectExpression(entityExp);
                        let relation: IExpression<boolean>;
                        for (const parentCol of selectOperand.entity.primaryColumns) {
                            const childCol = entityExp.columns.first(o => o.columnName === parentCol.columnName);
                            const logicalExp = new StrictEqualExpression(parentCol, childCol);
                            relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                        }
                        selectOperand.addJoin(selectExp, relation, "LEFT");
                        selectOperand = selectExp;
                    }

                    const predicateFn = expression.params[0] as FunctionExpression<boolean>;
                    const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: "where" };
                    this.scopeParameters.add(predicateFn.params[0].name, selectOperand.getVisitParam());
                    const whereExp = this.visit(predicateFn, visitParam) as IExpression<boolean>;
                    this.scopeParameters.remove(predicateFn.params[0].name);

                    if (whereExp.type !== Boolean) {
                        throw new Error(`Queryable<${objectOperand.itemType.name}>.where required predicate with boolean return value.`);
                    }

                    selectOperand.addWhere(whereExp);
                    return selectOperand;
                }
                case "contains": {
                    // TODO: dbset1.where(o => dbset2.select(c => c.column).contains(o.column)); use inner join for this
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    let item = expression.params[0];
                    let andExp: IExpression<boolean>;
                    const isSubSelect = objectOperand.isSubSelect;
                    if (isSubSelect) {
                        item = this.visit(item, param);
                        objectOperand.distinct = true;
                        objectOperand.parentRelation.parent.joins.remove(objectOperand.parentRelation as any);
                        objectOperand.parentRelation = null;
                        return new MethodCallExpression(objectOperand, "contains", [item]);
                    }
                    else if (objectOperand.itemType === objectOperand.entity.type) {
                        for (const primaryCol of objectOperand.entity.primaryColumns) {
                            const d = new EqualExpression(primaryCol, new MemberAccessExpression(item, primaryCol.propertyName));
                            andExp = andExp ? new AndExpression(andExp, d) : d;
                        }
                    }
                    else {
                        andExp = new EqualExpression(objectOperand.selects.first(), item);
                    }

                    if (param.scope === "queryable") {
                        objectOperand.addWhere(andExp);
                        const column = new ComputedColumnExpression(objectOperand.entity, new ValueExpression(true), this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.paging.take = new ValueExpression(1);
                        objectOperand.distinct = true;
                        return objectOperand;
                    }
                    return andExp;
                }
                case "distinct": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    objectOperand.distinct = true;
                    return objectOperand;
                }
                case "orderBy": {
                    const selectors = expression.params as ArrayValueExpression[];
                    const orders: IOrderExpression[] = [];
                    for (const selector of selectors) {
                        const selectorFn = selector.items[0] as FunctionExpression;
                        const direction = selector.items[1] ? selector.items[1] as ValueExpression<OrderDirection> : new ValueExpression<OrderDirection>("ASC");
                        const visitParam: IVisitParameter = { selectExpression: objectOperand, scope: expression.methodName };
                        this.scopeParameters.add(selectorFn.params[0].name, objectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam) as IColumnExpression;
                        this.scopeParameters.remove(selectorFn.params[0].name);

                        if (!isValueType(selectExp.type)) {
                            throw new Error(`Queryable<${objectOperand.itemType.name}>.orderBy required select with basic type return value.`);
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

                    if (param.scope !== "queryable") {
                        let takeJoinRel = objectOperand.joins.first(o => o instanceof PagingJoinRelation) as PagingJoinRelation;
                        if (takeJoinRel) {
                            // relation with paging
                            const orderJoinRel = takeJoinRel.child.joins[takeJoinRel.child.joins.length - 1];

                            let orderExp: IExpression<boolean>;
                            const entitExp = objectOperand.entity;
                            for (let i = 0, len = entitExp.primaryColumns.length; i < len; i++) {
                                const sortCol = orderJoinRel.child.entity.primaryColumns[i];
                                const filterCol = takeJoinRel.child.entity.primaryColumns[i];
                                const orderCompExp = new GreaterEqualExpression(sortCol, filterCol);
                                orderExp = orderExp ? new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp)) : orderCompExp;
                            }

                            // clone to support complex orderBy
                            const sortMap = new Map();
                            const filterMap = new Map();
                            for (const col of entitExp.columns) {
                                sortMap.set(col, orderJoinRel.child.entity.columns.first(c => c.propertyName === col.propertyName));
                                filterMap.set(col, takeJoinRel.child.entity.columns.first(c => c.propertyName === col.propertyName));
                            }

                            for (let i = 0, len = objectOperand.orders.length; i < len; i++) {
                                const order = objectOperand.orders[i];
                                const sortCol = sortMap.has(order.column) ? sortMap.get(order.column) : order.column.clone(sortMap);
                                const filterCol = filterMap.has(order.column) ? filterMap.get(order.column) : order.column.clone(filterMap);
                                const orderCompExp = order.direction === "DESC" ? new LessThanExpression(sortCol, filterCol) : new GreaterThanExpression(sortCol, filterCol);
                                orderExp = new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp));
                            }

                            // replace to new order
                            const oriOrderExp = takeJoinRel.order;
                            replaceExpression(orderJoinRel.relations, (exp) => {
                                if (exp === oriOrderExp)
                                    return orderExp;
                                return exp;
                            });
                        }
                    }
                    return objectOperand;
                }
                case "count": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    const countExp = new MethodCallExpression(objectOperand, expression.methodName, objectOperand.entity.primaryColumns, Number);
                    const parentRel = selectOperand.parentRelation;
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(objectOperand.entity, countExp, this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.itemExpression = column;
                        objectOperand.distinct = true;
                        return objectOperand;
                    }
                    else if (selectOperand instanceof GroupedExpression || (parentRel && parentRel.parent instanceof GroupByExpression)) {
                        // don't select unnecessary column
                        if (param.scope && param.scope.indexOf("select") === 0) {
                            selectOperand.selects = [];
                        }
                        return countExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const objExp = new ObjectValueExpression({});
                        if (selectOperand.parentRelation) {
                            for (const relCol of selectOperand.parentRelation.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }
                        const groupExp = new GroupByExpression(selectOperand, objExp);
                        groupExp.isAggregate = true;
                        const column = new ComputedColumnExpression(groupExp.entity, countExp, this.newAlias("column"));
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (objectOperand.isSubSelect) {
                            // alter relation to: parent -> bridge -> groupExp
                            const parentRel = selectOperand.parentRelation as JoinRelation;
                            const parentSelect = parentRel.parent;
                            parentSelect.joins.remove(parentRel);

                            const bridge = new SelectExpression(parentSelect.entity.clone());
                            this.setDefaultBehaviour(bridge);
                            bridge.entity.alias = this.newAlias();
                            bridge.selects = [];

                            const replaceMap = new Map();
                            for (const col of parentSelect.entity.columns) {
                                const cloneCol = bridge.entity.columns.first(o => o.columnName === col.columnName);
                                replaceMap.set(col, cloneCol);
                            }
                            addKeepInMap(replaceMap, groupExp);
                            // relation bridge -> groupExp
                            bridge.addJoin(groupExp, parentRel.relations.clone(replaceMap), parentRel.type);

                            // group the bridge so it could be easily join to parent
                            const bridgeAggreateExp = new MethodCallExpression(bridge, "sum", [column], Number);
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            const groupedBridge = new GroupByExpression(bridge, groupExp.key);

                            // add join from parent to bridge
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                const pCol = Enumerable.load(parentSelect.projectedColumns).first(o => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }
                            parentSelect.addJoin(groupedBridge, bridgeParentRelation, "LEFT");
                            groupedBridge.selects.add(bridgeColumn);

                            return bridgeColumn;
                        }

                        return column;
                    }
                }
                case "sum":
                case "avg":
                case "max":
                case "min": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    if (expression.params.length > 0) {
                        const selectorFn = expression.params[0] as FunctionExpression;
                        this.scopeParameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                        const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: expression.methodName };
                        const selectExpression: SelectExpression = this.visit(new MethodCallExpression(objectOperand, "select", [selectorFn]), visitParam) as any;
                        this.scopeParameters.remove(selectorFn.params[0].name);
                        param.selectExpression = visitParam.selectExpression;

                        if (!isValueType(selectExpression.itemType))
                            throw new Error(`Queryable<${selectOperand.type.name}> required select with basic type return value.`);

                        selectOperand = selectExpression;
                    }
                    const aggregateExp = new MethodCallExpression(selectOperand, expression.methodName, selectOperand.selects.select(o => {
                        if (o instanceof ComputedColumnExpression)
                            return o.expression;
                        return o;
                    }).toArray(), Number);
                    const parentRel = selectOperand.parentRelation;
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(selectOperand.entity, aggregateExp, this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.distinct = true;
                        return objectOperand;
                    }
                    else if (selectOperand instanceof GroupByExpression || (parentRel && parentRel.parent instanceof GroupByExpression)) {
                        return aggregateExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const objExp = new ObjectValueExpression({});
                        if (selectOperand.parentRelation) {
                            for (const relCol of selectOperand.parentRelation.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }
                        const groupExp = new GroupByExpression(selectOperand, objExp);
                        groupExp.isAggregate = true;
                        const column = new ComputedColumnExpression(groupExp.entity, aggregateExp, this.newAlias("column"));
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (objectOperand.isSubSelect) {
                            // create another join to bridge this and parent.
                            const parentSelect = selectOperand.parentRelation.parent;
                            const bridge = new SelectExpression(parentSelect.entity.clone());
                            this.setDefaultBehaviour(bridge);
                            bridge.entity.alias = this.newAlias();
                            bridge.selects = [];
                            bridge.joins = [];
                            bridge.includes = [];

                            // remove relation from this to parent
                            parentSelect.joins.remove(selectOperand.parentRelation as any);

                            // add relation from bridge to this
                            const replaceMap = new Map();
                            for (const col of parentSelect.entity.columns) {
                                const cloneCol = bridge.entity.columns.first(o => o.columnName === col.columnName);
                                replaceMap.set(col, cloneCol);
                            }
                            for (const col of groupExp.projectedColumns) {
                                replaceMap.set(col, col);
                            }
                            const bridgeCurRelation = selectOperand.parentRelation.relations.clone(replaceMap);
                            bridge.addJoin(groupExp, bridgeCurRelation, selectOperand.parentRelation.type as any);

                            // group the bridge so it could be easily join to parent
                            const bridgeAggreateExp = new MethodCallExpression(bridge, expression.methodName, [column], Number);
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            const groupedBridge = new GroupByExpression(bridge, groupExp.key);

                            // add join from parent to bridge
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                const pCol = Enumerable.load(parentSelect.projectedColumns).first(o => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }
                            parentSelect.addJoin(groupedBridge, bridgeParentRelation, "LEFT");
                            groupedBridge.selects.add(bridgeColumn);

                            return bridgeColumn;
                        }
                        return column;
                    }
                }
                case "all":
                case "any": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    const isAny = expression.methodName === "any";
                    if (!isAny && expression.params.length <= 0) {
                        throw new QueryBuilderError(QueryBuilderErrorCode.UsageIssue, "All required 1 parameter");
                    }

                    if (expression.params.length > 0) {
                        let predicateFn = expression.params[0] as FunctionExpression;
                        if (!isAny)
                            predicateFn.body = new NotExpression(predicateFn.body);
                        const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: expression.methodName };
                        this.visit(new MethodCallExpression(selectOperand, "where", [predicateFn]), visitParam);
                    }

                    const anyExp = new ValueExpression(isAny);
                    const parentRel = selectOperand.parentRelation;
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(objectOperand.entity, anyExp, this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.paging.take = new ValueExpression(1);
                        objectOperand.distinct = true;
                        return objectOperand;
                    }
                    else if (selectOperand instanceof GroupedExpression || (parentRel && parentRel.parent instanceof GroupByExpression)) {
                        // don't select unnecessary column
                        if (param.scope && param.scope.indexOf("select") === 0) {
                            selectOperand.selects = [];
                        }
                        return anyExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const objExp = new ObjectValueExpression({});
                        const parentRel = selectOperand.parentRelation as JoinRelation;
                        if (parentRel) {
                            for (const relCol of parentRel.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }
                        const groupExp = new GroupByExpression(selectOperand, objExp);
                        const column = new ComputedColumnExpression(groupExp.entity, anyExp, this.newAlias("column"));
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (objectOperand.isSubSelect) {
                            // create another join to bridge this and parent.
                            const parentSelect = parentRel.parent;
                            parentSelect.joins.remove(parentRel);

                            const bridge = new SelectExpression(parentSelect.entity.clone());
                            this.setDefaultBehaviour(bridge);
                            bridge.entity.alias = this.newAlias();
                            bridge.selects = [];

                            // add relation from bridge to current
                            const replaceMap = new Map();
                            for (const col of parentSelect.entity.columns) {
                                const cloneCol = bridge.entity.columns.first(o => o.columnName === col.columnName);
                                replaceMap.set(col, cloneCol);
                            }
                            for (const col of groupExp.projectedColumns) {
                                replaceMap.set(col, col);
                            }
                            let bridgeCurRelation = parentRel.relations.clone(replaceMap);
                            if (!isAny) {
                                bridgeCurRelation = new NotExpression(bridgeCurRelation);
                            }
                            bridge.addJoin(groupExp, bridgeCurRelation, parentRel.type);

                            // group the bridge so it could be easily join to parent
                            let bridgeAggreateExp: IExpression<boolean>;
                            if (isAny) {
                                bridgeAggreateExp = new StrictNotEqualExpression(new MethodCallExpression(bridge, "sum", [column], Number), new ValueExpression(null));
                            }
                            else {
                                bridgeAggreateExp = new StrictEqualExpression(new MethodCallExpression(bridge, "sum", [column], Number), new ValueExpression(null));
                            }

                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            const groupedBridge = new GroupByExpression(bridge, groupExp.key);

                            // add join from parent to bridge
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                const pCol = Enumerable.load(parentSelect.projectedColumns).first(o => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }
                            parentSelect.addJoin(groupedBridge, bridgeParentRelation, "LEFT");
                            groupedBridge.selects.add(bridgeColumn);

                            return new StrictEqualExpression(bridgeColumn, new ValueExpression(1));
                        }

                        return new (isAny ? StrictNotEqualExpression : StrictEqualExpression)(column, new ValueExpression(null));
                    }
                }
                case "first": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    if (expression.params.length > 0) {
                        const predicateFn = expression.params[0] as FunctionExpression;
                        const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: expression.methodName };
                        this.visit(new MethodCallExpression(selectOperand, "where" as any, [predicateFn]), visitParam);
                        param.selectExpression = visitParam.selectExpression;
                    }

                    if (param.scope === "queryable") {
                        selectOperand.paging.take = new ValueExpression(1);
                    }
                    else {
                        const entityExp = objectOperand.entity;
                        const filterer = (objectOperand as SelectExpression).clone();
                        filterer.entity.alias = this.newAlias();
                        filterer.includes = [];

                        const sorter = filterer.clone();
                        sorter.entity.alias = this.newAlias();

                        // column used for parent relations.
                        const parentRel = objectOperand.parentRelation as JoinRelation;
                        const relationColumns = parentRel.childColumns;

                        let joinExp: IExpression<boolean>;
                        for (const relCol of relationColumns) {
                            const sortCol = sorter.entity.columns.first(col => col.propertyName === relCol.propertyName);
                            const filterCol = filterer.entity.columns.first(col => col.propertyName === relCol.propertyName);
                            const logicalExp = new StrictEqualExpression(sortCol, filterCol);
                            joinExp = joinExp ? new AndExpression(joinExp, logicalExp) : logicalExp;
                        }

                        let orderExp: IExpression<boolean>;
                        for (let i = 0, len = entityExp.primaryColumns.length; i < len; i++) {
                            const sortCol = sorter.entity.primaryColumns[i];
                            const filterCol = filterer.entity.primaryColumns[i];
                            const orderCompExp = new GreaterEqualExpression(sortCol, filterCol);
                            orderExp = orderExp ? new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp)) : orderExp = orderCompExp;
                        }

                        for (let i = 0, len = objectOperand.orders.length; i < len; i++) {
                            const order = objectOperand.orders[i];
                            const sortCol = sorter.orders[i].column;
                            const filterCol = filterer.orders[i].column;
                            const orderCompExp = new (order.direction === "DESC" ? LessThanExpression : GreaterThanExpression)(sortCol, filterCol);
                            orderExp = new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp));
                        }

                        sorter.orders = filterer.orders = [];
                        filterer.addJoin(sorter, new AndExpression(joinExp, orderExp), "INNER");

                        const countExp = new MethodCallExpression(filterer, "count", filterer.entity.primaryColumns, Number);
                        const colCountExp = new ComputedColumnExpression(filterer.entity, countExp, this.newAlias("column"));

                        let keyExp: IExpression;
                        if (filterer.entity.primaryColumns.length > 1) {
                            keyExp = new ObjectValueExpression({});
                            filterer.entity.primaryColumns.each(o => (keyExp as ObjectValueExpression).object[o.propertyName] = o);
                        }
                        else {
                            keyExp = filterer.entity.primaryColumns.first();
                        }
                        const groupExp = new GroupByExpression(filterer, keyExp);
                        groupExp.selects = [colCountExp];

                        // add join relation to current object operand
                        let joinRelation: IExpression<boolean>;
                        for (let i = 0, len = entityExp.primaryColumns.length; i < len; i++) {
                            const objCol = entityExp.primaryColumns[i];
                            const groupCol = groupExp.entity.primaryColumns[i];
                            const logicalExp = new StrictEqualExpression(objCol, groupCol);
                            joinRelation = joinRelation ? new AndExpression(joinRelation, logicalExp) : logicalExp;
                        }

                        objectOperand.addJoin(groupExp, joinRelation, "INNER");
                        groupExp.having = new LessEqualExpression(countExp, new ValueExpression(1));
                    }
                    return selectOperand.entity;
                }
                case "skip":
                case "take": {
                    let exp = this.visit(expression.params[0] as ParameterExpression<number>, param);
                    if (param.scope === "queryable") {
                        if (objectOperand instanceof GroupByExpression && !objectOperand.isAggregate) {
                            // join to select that will page result by group instead of item.
                            const selectExp = objectOperand.itemSelect.clone();
                            selectExp.entity.alias = this.newAlias();
                            selectExp.selects = selectExp.groupBy.slice();
                            selectExp.includes = [];
                            selectExp.distinct = true;
                            selectOperand = selectExp;

                            let relation: IExpression<boolean>;
                            for (let i = 0, len = objectOperand.groupBy.length; i < len; i++) {
                                const parentCol = objectOperand.groupBy[i];
                                const childCol = selectExp.groupBy[i];
                                const logicalExp = new StrictEqualExpression(parentCol, childCol);
                                relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                            }

                            objectOperand.addJoin(selectExp, relation, "INNER");
                        }

                        if (expression.methodName === "skip") {
                            if (selectOperand.paging.take) {
                                selectOperand.paging.take = this.visit(new SubtractionExpression(selectOperand.paging.take, exp), param);
                                exp = this.visit(expression.params[0] as ParameterExpression<number>, param);
                            }
                            selectOperand.paging.skip = this.visit(selectOperand.paging.skip ? new AdditionExpression(selectOperand.paging.skip, exp) : exp, param);
                        }
                        else {
                            selectOperand.paging.take = this.visit(selectOperand.paging.take ? new MethodCallExpression(new ValueExpression(Math), "min", [selectOperand.paging.take, exp]) : exp, param);
                        }
                    }
                    else {
                        let takeJoinRel = objectOperand.joins.first(o => o instanceof PagingJoinRelation) as PagingJoinRelation;
                        if (!takeJoinRel) {
                            const entityExp = objectOperand.entity;
                            const filterer = (objectOperand as SelectExpression).clone();
                            filterer.entity.alias = this.newAlias();
                            filterer.includes = [];
                            filterer.selects = [];

                            const sorter = filterer.clone();
                            sorter.entity.alias = this.newAlias();

                            // column used for parent relations.
                            const parentRel = objectOperand.parentRelation;
                            const relationColumns = parentRel.childColumns;

                            let joinExp: IExpression<boolean>;
                            for (const relCol of relationColumns) {
                                const sortCol = sorter.entity.columns.first(col => col.propertyName === relCol.propertyName);
                                const filterCol = filterer.entity.columns.first(col => col.propertyName === relCol.propertyName);
                                const logicalExp = new StrictEqualExpression(sortCol, filterCol);
                                joinExp = joinExp ? new AndExpression(joinExp, logicalExp) : logicalExp;
                            }

                            let orderExp: IExpression<boolean>;
                            for (let i = 0, len = entityExp.primaryColumns.length; i < len; i++) {
                                const sortCol = sorter.entity.primaryColumns[i];
                                const filterCol = filterer.entity.primaryColumns[i];
                                const orderCompExp = new GreaterEqualExpression(sortCol, filterCol);
                                orderExp = orderExp ? new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp)) : orderCompExp;
                            }

                            for (let i = 0, len = objectOperand.orders.length; i < len; i++) {
                                const order = objectOperand.orders[i];
                                const sortCol = sorter.orders[i].column;
                                const filterCol = filterer.orders[i].column;
                                const orderCompExp = new (order.direction === "DESC" ? LessThanExpression : GreaterThanExpression)(sortCol, filterCol);
                                orderExp = new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp));
                            }

                            sorter.orders = filterer.orders = [];
                            filterer.addJoin(sorter, new AndExpression(joinExp, orderExp), "INNER");

                            const countExp = new MethodCallExpression(filterer, "count", filterer.entity.primaryColumns, Number);
                            const colCountExp = new ComputedColumnExpression(filterer.entity, countExp, this.newAlias("column"));

                            let keyExp: IExpression;
                            if (filterer.entity.primaryColumns.length > 1) {
                                keyExp = new ObjectValueExpression({});
                                filterer.entity.primaryColumns.each(o => (keyExp as ObjectValueExpression).object[o.propertyName] = o);
                            }
                            else {
                                keyExp = filterer.entity.primaryColumns.first();
                            }
                            const groupExp = new GroupByExpression(filterer, keyExp);
                            groupExp.isAggregate = true;
                            groupExp.selects.push(colCountExp);

                            // add join relation to current object operand
                            let joinRelation: IExpression<boolean>;
                            for (let i = 0, len = entityExp.primaryColumns.length; i < len; i++) {
                                const objCol = entityExp.primaryColumns[i];
                                const groupCol = groupExp.entity.primaryColumns[i];
                                const logicalExp = new StrictEqualExpression(objCol, groupCol);
                                joinRelation = joinRelation ? new AndExpression(joinRelation, logicalExp) : logicalExp;
                            }

                            takeJoinRel = new PagingJoinRelation(objectOperand, groupExp, joinRelation, "INNER");
                            objectOperand.joins.push(takeJoinRel);
                            groupExp.parentRelation = takeJoinRel;
                            takeJoinRel.order = orderExp;
                        }

                        const groupExp = takeJoinRel.child as GroupByExpression;
                        const countExp = (groupExp.selects.except(groupExp.groupBy).first() as ComputedColumnExpression).expression;

                        if (expression.methodName === "skip") {
                            takeJoinRel.start = this.visit(takeJoinRel.start ? new AdditionExpression(takeJoinRel.start, exp) : exp, param);
                        }
                        else {
                            takeJoinRel.end = this.visit(takeJoinRel.start ? new AdditionExpression(takeJoinRel.start, exp) : exp, param);
                        }

                        groupExp.having = null;
                        if (takeJoinRel.start) {
                            groupExp.having = new GreaterThanExpression(countExp, takeJoinRel.start);
                        }
                        if (takeJoinRel.end) {
                            const takeLogicalExp = new LessEqualExpression(countExp, takeJoinRel.end);
                            groupExp.having = groupExp.having ? new AndExpression(groupExp.having, takeLogicalExp) : takeLogicalExp;
                        }
                    }

                    return objectOperand;
                }
                case "union":
                case "intersect":
                case "except": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    const parentRelation = objectOperand.parentRelation;
                    const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: expression.methodName };
                    const childSelectOperand: SelectExpression = this.visit(expression.params[0], visitParam) as any;
                    param.selectExpression = visitParam.selectExpression;

                    let entityExp: IEntityExpression;
                    switch (expression.methodName) {
                        case "union":
                            const isUnionAll = expression.params[1];
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
                    this.setDefaultBehaviour(selectOperand);
                    if (parentRelation) {
                        parentRelation.child = selectOperand;
                        selectOperand.parentRelation = parentRelation;
                    }
                    else {
                        param.selectExpression = selectOperand;
                    }
                    return selectOperand;
                }
                case "innerJoin":
                case "leftJoin":
                case "rightJoin":
                case "fullJoin":
                case "groupJoin": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    const parentRelation = objectOperand.parentRelation;
                    const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: "join" };
                    const childSelectOperand: SelectExpression = this.visit(expression.params[0], visitParam) as any;

                    const relationSelector = expression.params[1] as FunctionExpression;
                    this.scopeParameters.add(relationSelector.params[0].name, selectOperand.getVisitParam());
                    this.scopeParameters.add(relationSelector.params[1].name, childSelectOperand.getVisitParam());
                    let relation: IExpression<boolean> = this.visit(relationSelector, visitParam);
                    this.scopeParameters.remove(relationSelector.params[0].name);
                    this.scopeParameters.remove(relationSelector.params[1].name);

                    let jointType: JoinType;
                    switch (expression.methodName) {
                        case "groupJoin":
                        case "leftJoin":
                            jointType = "LEFT";
                            break;
                        case "rightJoin":
                            jointType = "RIGHT";
                            break;
                        case "fullJoin":
                            jointType = "FULL";
                            break;
                        default:
                            jointType = "INNER";
                            break;
                    }

                    if (expression.methodName === "groupJoin") {
                        childSelectOperand.parentRelation = new JoinRelation(selectOperand, childSelectOperand, relation, jointType);
                    }
                    else {
                        selectOperand.addJoin(childSelectOperand, relation, jointType);
                    }

                    const resultVisitParam: IVisitParameter = { selectExpression: selectOperand, scope: "join" };
                    const resultSelector = expression.params[3] as FunctionExpression;
                    this.scopeParameters.add(resultSelector.params[1].name, expression.methodName === "groupJoin" ? childSelectOperand : childSelectOperand.getVisitParam());
                    this.visit(new MethodCallExpression(selectOperand, "select", [resultSelector]), resultVisitParam);
                    this.scopeParameters.remove(resultSelector.params[1].name);
                    if (parentRelation) {
                        parentRelation.child = selectOperand;
                        selectOperand.parentRelation = parentRelation;
                    }
                    else {
                        param.selectExpression = selectOperand;
                    }

                    return selectOperand;
                }
                case "pivot": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    const parentRelation = objectOperand.parentRelation;

                    const dimensions = expression.params[0] as FunctionExpression;
                    const metrics = expression.params[1] as FunctionExpression;

                    // groupby
                    let visitParam: IVisitParameter = { selectExpression: objectOperand, scope: expression.methodName };
                    const groupExp: GroupByExpression = this.visit(new MethodCallExpression(objectOperand, "groupBy", [dimensions]), visitParam) as any;
                    param.selectExpression = visitParam.selectExpression;

                    const dObject = (dimensions.body as ObjectValueExpression<any>).object;
                    const mObject = (metrics.body as ObjectValueExpression<any>).object;
                    const dmObject: { [key: string]: IExpression } = {};
                    for (const prop in dObject) {
                        dmObject[prop] = new FunctionExpression(new MemberAccessExpression(dimensions.params[0], prop), dimensions.params);
                    }
                    for (const prop in mObject)
                        dmObject[prop] = mObject[prop];

                    // select
                    const selectorFn = new FunctionExpression(new ObjectValueExpression(dmObject), metrics.params);
                    this.scopeParameters.add(dimensions.params[0].name, groupExp.key);
                    this.scopeParameters.add(selectorFn.params[0].name, groupExp.getVisitParam());
                    visitParam = { selectExpression: groupExp, scope: expression.methodName };
                    const selectExpression: SelectExpression = this.visit(new MethodCallExpression(groupExp, "select", [selectorFn]), visitParam) as any;
                    this.scopeParameters.remove(selectorFn.params[0].name);
                    this.scopeParameters.remove(dimensions.params[0].name);
                    param.selectExpression = visitParam.selectExpression;
                    selectOperand = selectExpression;

                    if (parentRelation) {
                        parentRelation.child = selectOperand;
                        selectOperand.parentRelation = parentRelation;
                    }
                    else {
                        param.selectExpression = selectOperand;
                    }
                    return selectOperand;
                }
                case "toArray": {
                    return objectOperand;
                }
            }
            throw new Error(`${expression.methodName} not supported on expression`);
        }
        else {
            expression.params = expression.params.select(o => this.visit(o, { selectExpression: param.selectExpression })).toArray();

            const isObjectOperandSafe = this.isSafe(objectOperand);
            const isExpressionSafe = isObjectOperandSafe && expression.params.all(o => this.isSafe(o));

            let translator;
            if (objectOperand instanceof ValueExpression) {
                translator = this.translator.resolve(objectOperand.value, expression.methodName);
                if (translator && translator.isPreferTranslate(expression, isExpressionSafe))
                    return expression;
            }
            if (!translator && objectOperand.type) {
                translator = this.translator.resolve(objectOperand.type.prototype, expression.methodName);
                if (translator && translator.isPreferTranslate(expression, isExpressionSafe)) {
                    return expression;
                }
            }

            // Execute in app if all parameter is available.
            if (isExpressionSafe) {
                let hasParam = false;
                [expression.objectOperand, hasParam] = this.extract(expression.objectOperand);
                expression.params = expression.params.select(o => {
                    const [res, isParam] = this.extract(o);
                    hasParam = hasParam || isParam;
                    return res;
                }).toArray();
                if (hasParam) {
                    const result = this.createParamBuilderItem(expression, param);
                    return result;
                }

                return new ValueExpression(expression.execute());
            }

            const oriObjectOperand = isObjectOperandSafe ? this.extractValue(objectOperand) : objectOperand;
            const methodFn: () => any = oriObjectOperand instanceof ValueExpression ? oriObjectOperand.value[expression.methodName] : objectOperand.type.prototype[expression.methodName];
            if (methodFn && !isNativeFunction(methodFn)) {
                // try convert user defined method to a FunctionExpression and built it as a query.
                const methodExp = ExpressionBuilder.parse(methodFn);
                const l = expression.params.length;
                for (let i = 0; i < l; i++) {
                    this.scopeParameters.add(methodExp.params[i].name, expression.params[i]);
                }
                const result = this.visitFunction(methodExp, { selectExpression: param.selectExpression });
                for (let i = 0; i < l; i++) {
                    this.scopeParameters.remove(methodExp.params[i].name);
                }
                return result;
            }
        }
        throw new Error(`${expression.methodName} not supported.`);
    }
    protected visitFunctionCall<T>(expression: FunctionCallExpression<T>, param: IVisitParameter): IExpression {
        expression.fnExpression = this.visit(expression.fnExpression, param);
        expression.params = expression.params.select((o) => this.visit(o, param)).toArray();

        const fnExp = expression.fnExpression = expression.fnExpression as ValueExpression<() => any>;
        const fn = fnExp.value;

        const isExpressionSafe = expression.params.all(o => this.isSafe(o));

        let translator = this.translator.resolve(fn);
        if (translator && translator.isPreferTranslate(expression, isExpressionSafe))
            return expression;

        // Execute function in application if all it's parameters available in application.
        if (isExpressionSafe) {
            let hasParam = false;
            expression.params = expression.params.select(o => {
                const [res, isParam] = this.extract(o);
                hasParam = hasParam || isParam;
                return res;
            }).toArray();
            if (hasParam) {
                const result = this.createParamBuilderItem(expression, param);
                return result;
            }

            return new ValueExpression(expression.execute());
        }

        // Try convert function as Expression
        if (!isNativeFunction(fn)) {
            const functionExp = ExpressionBuilder.parse(fn, this.parameters);
            const l = functionExp.params.length;
            for (let i = 0; i < l; i++) {
                this.scopeParameters.add(functionExp.params[i].name, expression.params[i]);
            }
            const result = this.visit(functionExp, { selectExpression: param.selectExpression });
            for (let i = 0; i < l; i++) {
                this.scopeParameters.remove(functionExp.params[i].name);
            }
            return result;
        }
        return expression;
    }
    protected visitBinaryOperator(expression: IBinaryOperatorExpression, param: IVisitParameter): IExpression {
        expression.leftOperand = this.visit(expression.leftOperand, param);
        expression.rightOperand = this.visit(expression.rightOperand, param);

        const isExpressionSafe = this.isSafe(expression.leftOperand) && this.isSafe(expression.rightOperand);
        if (isExpressionSafe) {
            let hasParam = false;
            let hasParam2 = false;
            [expression.leftOperand, hasParam] = this.extract(expression.leftOperand);
            [expression.rightOperand, hasParam2] = this.extract(expression.rightOperand);
            if (hasParam || hasParam2) {
                const result = this.createParamBuilderItem(expression, param);
                return result;
            }

            return new ValueExpression(expression.execute());
        }

        if (expression.leftOperand instanceof TernaryExpression) {
            const ternaryExp = expression.leftOperand as TernaryExpression;
            const falseOperand = expression.clone();
            falseOperand.leftOperand = ternaryExp.falseResultOperand;
            const trueOperand = expression.clone();
            trueOperand.leftOperand = ternaryExp.trueResultOperand;
            return new TernaryExpression(ternaryExp.logicalOperand, this.visit(trueOperand, param), this.visit(falseOperand, param));
        }
        else if (expression.rightOperand instanceof TernaryExpression) {
            const ternaryExp = expression.rightOperand as TernaryExpression;
            const falseOperand = expression.clone();
            falseOperand.rightOperand = ternaryExp.falseResultOperand;
            const trueOperand = expression.clone();
            trueOperand.rightOperand = ternaryExp.trueResultOperand;
            return new TernaryExpression(ternaryExp.logicalOperand, this.visit(trueOperand, param), this.visit(falseOperand, param));
        }

        return expression;
    }
    protected visitUnaryOperator(expression: IUnaryOperatorExpression, param: IVisitParameter): IExpression {
        expression.operand = this.visit(expression.operand, param);

        const isExpressionSafe = this.isSafe(expression.operand);
        if (isExpressionSafe) {
            let hasParam = false;
            [expression.operand, hasParam] = this.extract(expression.operand);
            if (hasParam) {
                const result = this.createParamBuilderItem(expression, param);
                return result;
            }
            return new ValueExpression(expression.execute());
        }

        if (expression.operand instanceof TernaryExpression) {
            const ternaryExp = expression.operand as TernaryExpression;
            const falseOperand = expression.clone();
            falseOperand.operand = ternaryExp.falseResultOperand;
            const trueOperand = expression.clone();
            trueOperand.operand = ternaryExp.trueResultOperand;
            return new TernaryExpression(ternaryExp.logicalOperand, trueOperand, falseOperand);
        }
        return expression;
    }
    protected visitTernaryOperator(expression: TernaryExpression<any>, param: IVisitParameter): IExpression {
        expression.logicalOperand = this.visit(expression.logicalOperand, param);
        expression.trueResultOperand = this.visit(expression.trueResultOperand, param);
        expression.falseResultOperand = this.visit(expression.falseResultOperand, param);


        const isExpressionSafe = this.isSafe(expression.logicalOperand) && this.isSafe(expression.trueResultOperand) && this.isSafe(expression.falseResultOperand);
        if (isExpressionSafe) {
            let hasParam = expression.logicalOperand instanceof ParameterExpression || expression.trueResultOperand instanceof ParameterExpression || expression.falseResultOperand instanceof ParameterExpression;
            [expression.logicalOperand] = this.extract(expression.logicalOperand);
            [expression.trueResultOperand] = this.extract(expression.trueResultOperand);
            [expression.falseResultOperand] = this.extract(expression.falseResultOperand);
            if (hasParam) {
                const result = this.createParamBuilderItem(expression, param);
                return result;
            }
            return new ValueExpression(expression.execute());
        }
        return expression;
    }
    protected visitObjectLiteral<T extends { [Key: string]: IExpression } = any>(expression: ObjectValueExpression<T>, param: IVisitParameter) {
        switch (param.scope) {
            case "groupBy":
            case "select": {
                const selectExp = param.selectExpression;
                const entityExp = selectExp.entity;
                const embeddedEntity = entityExp.clone();
                embeddedEntity.alias = this.newAlias();
                const embeddedSelect = new SelectExpression(embeddedEntity);
                embeddedSelect.selects = [];
                embeddedSelect.itemExpression = expression;

                let replaceMap: Map<any, any> = null;
                const possibleKeys: string[] = [];
                for (const key of this.scopeParameters.keys) {
                    const val = this.scopeParameters.get(key);
                    if (val === entityExp) {
                        possibleKeys.push(key);
                        this.scopeParameters.add(key, embeddedEntity);
                    }
                }

                for (const prop in expression.object) {
                    let valExp = expression.object[prop];
                    const litVisitParam = { selectExpression: embeddedSelect, scope: valExp instanceof ObjectValueExpression ? param.scope : "select-object" };
                    valExp = this.visit(valExp, litVisitParam);

                    if (valExp instanceof SelectExpression) {
                        if (valExp instanceof GroupedExpression && valExp.groupByExp === selectExp) {
                            const groupByExp = valExp.groupByExp;
                            const parentGroupExp = selectExp as GroupByExpression;
                            const childSelectExp = groupByExp.clone();
                            const childEntity = childSelectExp.entity;
                            childEntity.alias = this.newAlias();

                            if (!replaceMap) {
                                replaceMap = new Map();
                                replaceMap.set(entityExp, embeddedEntity);
                                for (const col of entityExp.columns) {
                                    const embeddedCol = embeddedEntity.columns.first(o => o.propertyName === col.propertyName);
                                    replaceMap.set(col, embeddedCol);
                                }
                            }

                            let relation: IExpression<boolean>;
                            for (const pCol of groupByExp.groupBy) {
                                let childCol = pCol instanceof ComputedColumnExpression ? pCol.clone(replaceMap) : parentGroupExp.groupBy.first(o => o.propertyName === pCol.propertyName);
                                const logicalExp = new StrictEqualExpression(pCol, childCol);
                                relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                            }
                            embeddedSelect.addInclude(prop, childSelectExp, relation, "one");
                        }
                        else {
                            joinToInclude(valExp, embeddedSelect, prop, "many");
                        }
                    }
                    else if ((valExp as IEntityExpression).primaryColumns) {
                        let entityExp = valExp as IEntityExpression;
                        if (entityExp === embeddedSelect.entity) {
                            const entityClone = entityExp.clone();
                            entityClone.alias = this.newAlias();
                            const childSelectExp = new SelectExpression(entityClone);
                            let relation: IExpression<boolean>;
                            for (const pCol of entityClone.primaryColumns) {
                                const childCol = entityExp.primaryColumns.first(o => o.propertyName === pCol.propertyName);
                                const logicalExp = new StrictEqualExpression(pCol, childCol);
                                relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                            }
                            embeddedSelect.addInclude(prop, childSelectExp, relation, "one");
                        }
                        else {
                            const childSelectExp = entityExp.select!;
                            joinToInclude(childSelectExp, embeddedSelect, prop, "one");
                        }
                    }
                    else if (valExp instanceof ComputedColumnExpression) {
                        const columnExp = new ColumnExpression(valExp.entity, valExp.type, prop, valExp.columnName, valExp.isPrimary, valExp.isNullable, valExp.columnType);
                        embeddedSelect.selects.push(columnExp);
                    }
                    else if ((valExp as IColumnExpression).entity) {
                        const columnExp = valExp as IColumnExpression;
                        columnExp.propertyName = prop;
                        embeddedSelect.selects.push(columnExp);
                    }
                    else {
                        const columnExp = new ComputedColumnExpression(selectExp.entity, valExp, prop);
                        // aggregated column should be not nullable
                        if (valExp instanceof MethodCallExpression && valExp.objectOperand instanceof GroupedExpression && valExp.type === Number) {
                            columnExp.isNullable = false;
                        }
                        embeddedSelect.selects.push(columnExp);
                    }
                }

                for (const key of possibleKeys) {
                    this.scopeParameters.remove(key);
                }

                let relations: IExpression<boolean>;
                if (selectExp instanceof GroupByExpression) {
                    for (const pCol of selectExp.groupBy) {
                        let childCol = pCol instanceof ComputedColumnExpression ? pCol.clone(replaceMap) : parentGroupExp.groupBy.first(o => o.propertyName === pCol.propertyName);
                        const logicalExp = new StrictEqualExpression(pCol, childCol);
                        relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
                    }
                }
                else {
                    for (const pCol of entityExp.primaryColumns) {
                        const embeddedCol = embeddedEntity.columns.first(o => o.propertyName === pCol.propertyName);
                        const logicalExp = new StrictEqualExpression(pCol, embeddedCol);
                        relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
                    }
                }
                const joinRel = selectExp.addJoin(embeddedSelect, relations, "INNER");
                joinRel.isEmbedded = true;
                return embeddedSelect.entity;
            }
            default: {
                throw new Error("Should not be called");
            }
        }
    }
    //#endregion
}

const joinToInclude = <TChild, TParent>(childExp: SelectExpression<TChild>, parentExp: SelectExpression<TParent>, name: string, relationType: RelationshipType) => {
    let parentRel = childExp.parentRelation as JoinRelation<TParent, TChild>;
    while (parentRel && (parentRel as any).name === undefined && parentRel.parent !== parentExp) {
        const nextRel = parentRel.parent.parentRelation as JoinRelation<any, any>;
        parentRel.parent.joins.remove(parentRel);
        parentRel.child.addJoin(parentRel.parent, parentRel.relations, "INNER");
        if (!parentRel) break;
        parentRel = nextRel;
    }

    if (!parentRel)
        return null;

    parentExp.joins.remove(parentRel);
    const includeRel = parentExp.addInclude(name, childExp, parentRel.relations, relationType);
    includeRel.isEmbedded = parentRel.isEmbedded;
    return includeRel;
};

const reverseJoin = (childExp: SelectExpression, root?: SelectExpression) => {
    if (childExp === root) return;
    let joinRels: JoinRelation[] = [];
    let selectExp = childExp;
    while ((!root || (selectExp !== root)) && selectExp.parentRelation && selectExp.parentRelation instanceof JoinRelation) {
        const joinRel = selectExp.parentRelation as JoinRelation;
        joinRels.push(joinRel);
        selectExp = joinRel.parent;
    }
    const rootRel = selectExp.parentRelation;
    for (const joinRel of joinRels) {
        const parent = joinRel.parent;
        parent.joins.remove(joinRel);
        const reverseJoin = joinRel.child.addJoin(parent, joinRel.relations, "INNER");
        reverseJoin.isEmbedded = joinRel.isEmbedded;
    }
    childExp.parentRelation = rootRel;
    if (rootRel) {
        rootRel.child = childExp;
    }
};
