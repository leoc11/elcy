import "../../Extensions/StringExtension";
import { JoinType, OrderDirection, RelationshipType, GenericType } from "../../Common/Type";
import { relationMetaKey, columnMetaKey } from "../../Decorator/DecoratorKey";
import { TransformerParameter } from "../../ExpressionBuilder/TransformerParameter";
import { isValueType, isNativeFunction, isValue, replaceExpression, mapKeepExp, mapReplaceExp, isEntityExp, isColumnExp, resolveClone } from "../../Helper/Util";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "../../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../../Queryable/QueryExpression/IColumnExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { GroupedExpression } from "../../Queryable/QueryExpression/GroupedExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { InstantiationExpression } from "../../ExpressionBuilder/Expression/InstantiationExpression";
import { IMemberOperatorExpression } from "../../ExpressionBuilder/Expression/IMemberOperatorExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { ProjectionEntityExpression } from "../../Queryable/QueryExpression/ProjectionEntityExpression";
import { ComputedColumnExpression } from "../../Queryable/QueryExpression/ComputedColumnExpression";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { FunctionCallExpression } from "../../ExpressionBuilder/Expression/FunctionCallExpression";
import { NotExpression } from "../../ExpressionBuilder/Expression/NotExpression";
import { IUnaryOperatorExpression } from "../../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { IEntityExpression } from "../../Queryable/QueryExpression/IEntityExpression";
import { IOrderExpression } from "../../Queryable/QueryExpression/IOrderExpression";
import { UnionExpression } from "../../Queryable/QueryExpression/UnionExpression";
import { IntersectExpression } from "../../Queryable/QueryExpression/IntersectExpression";
import { ExceptExpression } from "../../Queryable/QueryExpression/ExceptExpression";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { EmbeddedRelationMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { ExpressionExecutor } from "../../ExpressionBuilder/ExpressionExecutor";
import { SubstractionExpression } from "../../ExpressionBuilder/Expression/SubstractionExpression";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { QueryTranslator } from "../../QueryBuilder/QueryTranslator/QueryTranslator";
import { NamingStrategy } from "../../QueryBuilder/NamingStrategy";
import { Queryable } from "../../Queryable/Queryable";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "../../ExpressionBuilder/Expression/StrictNotEqualExpression";
import { QueryBuilderError, QueryBuilderErrorCode } from "../../Error/QueryBuilderError";
import { CustomEntityExpression } from "../../Queryable/QueryExpression/CustomEntityExpression";
import { GreaterThanExpression } from "../../ExpressionBuilder/Expression/GreaterThanExpression";
import { LessThanExpression } from "../../ExpressionBuilder/Expression/LessThanExpression";
import { OrExpression } from "../../ExpressionBuilder/Expression/OrExpression";
import { LessEqualExpression } from "../../ExpressionBuilder/Expression/LessEqualExpression";
import { GreaterEqualExpression } from "../../ExpressionBuilder/Expression/GreaterEqualExpression";
import { JoinRelation } from "../../Queryable/Interface/JoinRelation";
import { IncludeRelation } from "../../Queryable/Interface/IncludeRelation";
import { PagingJoinRelation } from "../../Queryable/Interface/PagingJoinRelation";
import { Enumerable } from "../../Enumerable/Enumerable";
import { IBaseRelationMetaData } from "../../MetaData/Interface/IBaseRelationMetaData";
import { IQueryVisitor } from "../../Query/IQueryVisitor";
import { ISelectQueryOption } from "../../Queryable/QueryExpression/ISelectQueryOption";
import { IQueryVisitParameter } from "../../Query/IQueryVisitParameter";

export class RelationQueryVisitor implements IQueryVisitor {
    public option: ISelectQueryOption;
    public scopeParameters = new TransformerParameter();
    private aliasObj: { [key: string]: number } = {};
    public namingStrategy: NamingStrategy;
    public translator: QueryTranslator;
    constructor() {
        this.option = {};
        this.valueTransformer = new ExpressionExecutor();
    }
    protected parameterStackIndex: number;
    protected parameters: { [key: string]: any } = {};
    public readonly sqlParameters: Map<string, SqlParameterExpression> = new Map();
    public valueTransformer: ExpressionExecutor;
    public newAlias(type: "entity" | "column" | "param" = "entity") {
        if (!this.aliasObj[type])
            this.aliasObj[type] = 0;
        return this.namingStrategy.getAlias(type) + this.aliasObj[type]++;
    }
    public setParameter(flatParameterStacks: { [key: string]: any }, parameterStackIndex: number, parameter: { [key: string]: any }) {
        flatParameterStacks = flatParameterStacks ? flatParameterStacks : {};
        this.parameters = parameter ? parameter : {};
        this.parameterStackIndex = parameterStackIndex;
        this.valueTransformer = new ExpressionExecutor(flatParameterStacks);
    }
    protected createParamBuilderItem(expression: IExpression, param: IQueryVisitParameter, paramName?: string) {
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
    protected extractValue(exp: IExpression) {
        if (exp instanceof ParameterExpression) {
            const key = this.getParameterExpressionKey(exp);
            const existing = this.sqlParameters.get(key);
            this.sqlParameters.delete(key);
            const value = this.valueTransformer.execute(existing);
            return new ValueExpression(value);
        }
        return exp;
    }
    protected isSafe(exp: IExpression) {
        if (exp instanceof ParameterExpression) {
            const scopeParam = this.scopeParameters.get(exp.name);
            return typeof scopeParam === "undefined";
        }
        return exp instanceof ValueExpression;
    }

    public setDefaultBehaviour<T>(selectExp: SelectExpression<T>) {
        const entityExp = selectExp.entity;
        if (entityExp.deleteColumn && !(this.option.includeSoftDeleted)) {
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
    public visit(exp: IExpression, param: IQueryVisitParameter): IExpression {
        // TODO: ultimate goal is to remove clone as much as possible.
        if (!(exp instanceof SelectExpression || exp instanceof SqlParameterExpression ||
            exp instanceof FunctionExpression ||
            exp instanceof EntityExpression || exp instanceof ProjectionEntityExpression ||
            exp instanceof ColumnExpression || exp instanceof ComputedColumnExpression)) {
            const findMap = new Map();
            mapKeepExp(findMap, param.selectExpression);
            exp = exp.clone(findMap);
        }
        switch (exp.constructor) {
            case MethodCallExpression:
            case MemberAccessExpression: {
                const memberExpression = exp as IMemberOperatorExpression<any>;
                memberExpression.objectOperand = this.visit(memberExpression.objectOperand, param);
                if (memberExpression.objectOperand instanceof TernaryExpression) {
                    const ternaryExp = memberExpression.objectOperand as TernaryExpression<any, any>;
                    const trueOperand = memberExpression.clone();
                    trueOperand.objectOperand = ternaryExp.trueResultOperand;
                    const falseOperand = memberExpression.clone();
                    falseOperand.objectOperand = ternaryExp.falseResultOperand;
                    return new TernaryExpression(ternaryExp.logicalOperand, this.visit(trueOperand, param), this.visit(falseOperand, param));
                }
                return exp instanceof MemberAccessExpression ? this.visitMember(exp as any, param) : this.visitMethod(exp as any, param);
            }
            case FunctionCallExpression:
                return this.visitFunctionCall(exp as any, param);
            case InstantiationExpression:
                return this.visitInstantiation(exp as any, param);
            case TernaryExpression:
                return this.visitTernaryOperator(exp as any, param);
            case ObjectValueExpression:
                return this.visitObjectLiteral(exp as ObjectValueExpression<any>, param);
            case ArrayValueExpression:
                throw new Error(`literal Array not supported`);
            case FunctionExpression:
                return this.visitFunction(exp as FunctionExpression, [], param);
            case ParameterExpression:
                return this.visitParameter(exp as any, param);
            default: {
                if ((exp as IBinaryOperatorExpression).leftOperand) {
                    return this.visitBinaryOperator(exp as any, param);
                }
                else if ((exp as IUnaryOperatorExpression).operand) {
                    return this.visitUnaryOperator(exp as any, param);
                }
            }
        }
        return exp;
    }
    protected visitParameter<T>(exp: ParameterExpression<T>, param: IQueryVisitParameter) {
        let result = this.scopeParameters.get(exp.name);
        if (!result) {
            const value = this.parameters[exp.name];
            if (value instanceof Queryable) {
                const selectExp = value.buildQuery(this) as SelectExpression;
                selectExp.isSubSelect = true;
                param.selectExpression.addJoin(selectExp, null, "LEFT");
                return selectExp;
            }
            else if (value instanceof Function) {
                return new ValueExpression(value, exp.name);
            }
            else if (value instanceof Array) {
                const paramExp = new ParameterExpression(this.parameterStackIndex + ":" + exp.name, exp.type);
                paramExp.itemType = exp.itemType;
                const sqlParameterExp = this.createParamBuilderItem(paramExp, param, exp.name);
                const arrayValue = value as any[];

                let arrayItemType = arrayValue[Symbol.arrayItemType];
                const isTypeSpecified = !!arrayItemType;
                if (!arrayItemType) {
                    arrayItemType = arrayValue.where(o => !!o).first();
                }
                const itemType = arrayItemType ? arrayItemType.constructor : Object;

                const entityExp = new CustomEntityExpression("#" + exp.name + this.parameterStackIndex, [], itemType, this.newAlias());
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

            const paramExp = new ParameterExpression(this.parameterStackIndex + ":" + exp.name, exp.type);
            paramExp.itemType = exp.itemType;
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
            const relations = rel.relation.clone(replaceMap);
            param.selectExpression.addJoin(clone, relations, rel.type);
        }
        return result;
    }
    public visitFunction<T>(exp: FunctionExpression<T>, parameters: IExpression[], param: IQueryVisitParameter) {
        const i = 0;
        for (const paramExp of exp.params) {
            this.scopeParameters.add(paramExp.name, parameters[i]);
        }
        const result = this.visit(exp.body, param);
        for (const paramExp of exp.params) {
            this.scopeParameters.remove(paramExp.name);
        }
        return result as IExpression<T>;
    }
    protected visitMember<T, K extends keyof T>(exp: MemberAccessExpression<T, K>, param: IQueryVisitParameter): IExpression {
        const objectOperand = exp.objectOperand;
        if (exp.memberName === "prototype" || exp.memberName === "__proto__")
            throw new Error(`property ${exp.memberName} not supported in linq to sql.`);

        if (isEntityExp(objectOperand)) {
            let column = objectOperand.columns.first((c) => c.propertyName === exp.memberName);
            if (!column && objectOperand instanceof EntityExpression) {
                const computedColumnMeta = Reflect.getOwnMetadata(columnMetaKey, objectOperand.type, exp.memberName as string);
                if (computedColumnMeta instanceof ComputedColumnMetaData) {
                    const result = this.visitFunction(computedColumnMeta.functionExpression, [objectOperand], { selectExpression: param.selectExpression });
                    if (result instanceof EntityExpression || result instanceof SelectExpression)
                        throw new Error(`${objectOperand.type.name}.${exp.memberName} not supported`);

                    column = new ComputedColumnExpression(objectOperand, result, exp.memberName as any);
                }
            }

            if (column) {
                if (param.scope === "project" && objectOperand.select) {
                    objectOperand.select.selects.add(column);
                }
                return column;
            }

            if (objectOperand.select) {
                const selectExp = objectOperand.select;
                const colExp = selectExp.selects.first(c => c.propertyName === exp.memberName);
                if (colExp) return colExp;
                let include = selectExp.includes.first((c) => c.name === exp.memberName);
                if (include) {
                    const replaceMap = new Map();
                    const child = include.child.clone(replaceMap);
                    mapReplaceExp(replaceMap, selectExp.entity, objectOperand);
                    const relation = include.relation.clone(replaceMap);

                    switch (param.scope) {
                        case "project":
                        case "include":
                            {
                                selectExp.addInclude(include.name, child, relation, include.type, include.isEmbedded);
                                return include.type === "many" ? child : child.entity;
                            }
                        default:
                            {
                                let joinType: JoinType = "LEFT";
                                if (include.type === "one" && param.scope === "where")
                                    joinType = "INNER";

                                selectExp.addJoin(child, relation, joinType, include.isEmbedded);
                                return include.type === "many" ? child : child.entity;
                            }
                    }
                }
            }

            const relationMeta: IBaseRelationMetaData<T, any> = Reflect.getOwnMetadata(relationMetaKey, objectOperand.type, exp.memberName as string);
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
                        objectOperand.select!.addInclude(exp.memberName as any, child, relationMeta);
                        return relationMeta.relationType === "many" ? child : child.entity;
                    }
                    default: {
                        let child = new SelectExpression(entityExp);
                        this.setDefaultBehaviour(child);

                        objectOperand.select!.addJoin(child, relationMeta);
                        return relationMeta.relationType === "many" ? child : child.entity;
                    }
                }
            }
        }
        else if (objectOperand instanceof SelectExpression && exp.memberName === "length") {
            return this.visit(new MethodCallExpression(objectOperand, "count", []), param);
        }
        else if (objectOperand instanceof GroupedExpression) {
            if (exp.memberName === "key") {
                const result = objectOperand.key;
                if (isEntityExp(result)) {
                    switch (param.scope) {
                        case "project":
                        case "include":
                        case "select-object": {
                            return result;
                        }
                        default: {
                            const includeRel = objectOperand.groupByExp.keyRelation;
                            const replaceMap = new Map();
                            mapKeepExp(replaceMap, result);
                            const childExp = result.select.clone(replaceMap);

                            mapReplaceExp(replaceMap, objectOperand.groupByExp, objectOperand);
                            objectOperand.addJoin(childExp, includeRel.relation.clone(replaceMap), "INNER", includeRel.isEmbedded);
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
            exp.objectOperand = existing.valueGetter;
            const result = this.createParamBuilderItem(exp, param);
            return result;
        }
        else if (objectOperand instanceof ObjectValueExpression) {
            throw new Error("NOT NEEDED");
        }
        else {
            let translator;
            const isExpressionSafe = this.isSafe(objectOperand);

            if (objectOperand instanceof ValueExpression) {
                translator = this.translator.resolve(objectOperand.value, exp.memberName as any);
                if (translator && (!isExpressionSafe || translator.isTranslate(exp))) {
                    return exp;
                }
            }

            if (!translator && objectOperand.type) {
                translator = this.translator.resolve(objectOperand.type.prototype, exp.memberName as any);
                if (translator && (!isExpressionSafe || translator.isTranslate(exp)))
                    return exp;
            }

            // Execute in app if all parameter is available.
            if (isExpressionSafe) {
                let hasParam = false;
                [exp.objectOperand, hasParam] = this.extract(exp.objectOperand);
                if (hasParam) {
                    const result = this.createParamBuilderItem(exp, param);
                    return result;
                }
                return new ValueExpression(this.valueTransformer.execute(exp));
            }
        }

        throw new Error(`${objectOperand.type.name}.${exp.memberName} is invalid or not supported in linq to sql.`);
    }
    protected visitInstantiation<T>(exp: InstantiationExpression<T>, param: IQueryVisitParameter): IExpression {
        const clone = exp.clone();
        exp.typeOperand = this.visit(exp.typeOperand, param) as any;
        exp.params = exp.params.select(o => this.visit(o, param)).toArray();
        const paramExps: ParameterExpression[] = [];
        const isExpressionSafe = this.isSafe(exp.typeOperand) && exp.params.all(o => this.isSafe(o));

        let translator = this.translator.resolve(exp.typeOperand.value);
        if (translator && (!isExpressionSafe || translator.isTranslate(exp)))
            return exp;

        if (isExpressionSafe) {
            paramExps.forEach(o => {
                const key = this.getParameterExpressionKey(exp);
                const existing = this.sqlParameters.get(key);
                if (existing)
                    this.sqlParameters.delete(key);
            });

            const result = this.createParamBuilderItem(clone, param);
            return result;
        }

        throw new Error(`${exp.type.name} not supported.`);
    }
    protected visitMethod<T, K extends keyof T, R = any>(exp: MethodCallExpression<T, K, R>, param: IQueryVisitParameter): IExpression {
        const objectOperand = exp.objectOperand;

        if (objectOperand instanceof SelectExpression) {
            let selectOperand = objectOperand as SelectExpression;
            switch (exp.methodName) {
                case "groupBy": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    const parentRelation = objectOperand.parentRelation;
                    const selectorFn = exp.params[0] as FunctionExpression<R>;
                    const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: exp.methodName };
                    const selectExp = this.visitFunction(selectorFn, [selectOperand.getItemExpression()], visitParam);
                    param.selectExpression = visitParam.selectExpression;

                    if (selectExp instanceof SelectExpression) {
                        throw new Error(`groupBy did not support selector which return array/queryable/enumerable.`);
                    }

                    let key = selectExp;
                    if (isEntityExp(selectExp)) {
                        const childSelectExp = selectExp.select;
                        if (childSelectExp === selectOperand) {
                            throw new Error(`groupBy did not support selector which return itselft.`);
                        }

                        reverseJoin(childSelectExp, selectOperand, true);
                        // remove relation to groupBy expression.
                        const parentRel = childSelectExp.parentRelation as JoinRelation;
                        parentRel.parent.joins.remove(parentRel);
                    }
                    else if (isColumnExp(selectExp)) {
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
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    const cloneObjectOperand = selectOperand instanceof GroupedExpression && param.scope !== "selectMany" && param.scope !== "select" && param.scope !== "queryable";
                    const oriJoinCount = selectOperand.joins.length;

                    const selectorFn = (exp.params.length > 1 ? exp.params[1] : exp.params[0]) as FunctionExpression<R>;
                    const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: exp.methodName };
                    let selectExp = this.visitFunction(selectorFn, [selectOperand.getItemExpression()], visitParam);

                    if (selectExp !== selectOperand.getItemExpression()) {
                        if (selectOperand instanceof GroupByExpression) {
                            selectOperand.isAggregate = true;
                        }

                        if (exp.methodName === "select") {
                            if (selectExp instanceof SelectExpression) {
                                // group result by relation to parent.
                                reverseJoin(selectExp, selectOperand, cloneObjectOperand);

                                const objExp = new ObjectValueExpression({});
                                const paramExp = new ParameterExpression("o", selectExp.itemType);
                                for (const relCol of selectOperand.parentRelation.parentColumns) {
                                    objExp.object[relCol.propertyName] = relCol;
                                }
                                const fnExp = new FunctionExpression(objExp, [paramExp]);
                                const groupByMethodExp = new MethodCallExpression(selectExp, "groupBy", [fnExp]);
                                const groupByExp = this.visit(groupByMethodExp, param) as GroupByExpression;
                                selectOperand = groupByExp;
                            }
                            else if (isEntityExp(selectExp)) {
                                const childExp = selectExp.select;
                                // if child select did not have parent relation, that means that
                                // child select is replacement for current param.selectExpression
                                if (!childExp.parentRelation && selectOperand.parentRelation) {
                                    const parentRel = selectOperand.parentRelation;
                                    childExp.parentRelation = parentRel;
                                    parentRel.child = childExp;
                                    const replaceMap = new Map<IExpression, IExpression>([[selectOperand, childExp]]);
                                    for (const col of selectOperand.relationColumns) {
                                        const projectCol = childExp.entity.columns.first(o => o.columnName === col.columnName);
                                        replaceMap.set(col, projectCol);
                                    }
                                    mapKeepExp(replaceMap, parentRel.parent);
                                    parentRel.relation = parentRel.relation.clone(replaceMap);
                                    selectOperand = childExp;
                                }
                                else {
                                    // return child select and add current select expression as a join relation.
                                    selectOperand = reverseJoin(childExp, selectOperand, cloneObjectOperand);
                                }
                            }
                            else {
                                // scalar value
                                if (cloneObjectOperand && selectOperand.joins.length === oriJoinCount) {
                                    const entityExp = selectOperand.entity.clone();
                                    entityExp.alias = this.newAlias();
                                    const cloneSelectExp = new SelectExpression(entityExp);

                                    const cloneMap = new Map();
                                    mapReplaceExp(cloneMap, selectOperand.entity, entityExp);
                                    let relations: IExpression<boolean>;
                                    for (const pCol of selectOperand.primaryKeys) {
                                        let embeddedCol = cloneSelectExp.allColumns.first(o => o.propertyName === pCol.propertyName);
                                        if (!embeddedCol) {
                                            embeddedCol = pCol.clone(cloneMap);
                                        }
                                        const logicalExp = new StrictEqualExpression(pCol, embeddedCol);
                                        relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
                                    }
                                    selectOperand.addJoin(cloneSelectExp, relations, "LEFT");
                                    selectOperand = cloneSelectExp;

                                    selectExp = resolveClone(selectExp, cloneMap);
                                }

                                if (isColumnExp(selectExp)) {
                                    if (selectOperand instanceof GroupByExpression && selectOperand.key === selectExp) {
                                        selectOperand.itemExpression = selectExp;
                                        selectOperand.selects = [selectExp];
                                    }
                                    else {
                                        let colExp = selectExp as IColumnExpression;
                                        selectOperand = reverseJoin(selectExp.entity.select, selectOperand, cloneObjectOperand);
                                        if (selectExp.entity !== selectOperand.entity) {
                                            colExp = selectOperand.allColumns.first(o => o.dataPropertyName === colExp.dataPropertyName);
                                        }
                                        selectOperand.itemExpression = colExp;
                                        selectOperand.selects = [colExp];
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
                        }
                        else {
                            if (!(selectExp instanceof SelectExpression)) {
                                throw new Error(`Queryable<${objectOperand.itemType.name}>.selectMany required selector with array or queryable or enumerable return value.`);
                            }
                            selectOperand = reverseJoin(selectExp, selectOperand, cloneObjectOperand);
                        }

                        if (!selectOperand.isSubSelect)
                            param.selectExpression = selectOperand;
                    }

                    const type = exp.params.length > 1 ? exp.params[0] as ValueExpression<GenericType> : null;
                    if (type) {
                        selectOperand.itemExpression.type = type.value;
                    }

                    return selectOperand;
                }
                case "project":
                case "include": {
                    if (exp.methodName === "project") {
                        objectOperand.selects = [];
                    }
                    for (const paramFn of exp.params) {
                        const selectorFn = paramFn as FunctionExpression<R>;
                        let visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: exp.methodName };
                        this.visitFunction(selectorFn, [objectOperand.getItemExpression()], visitParam);
                    }
                    return objectOperand;
                }
                case "where": {
                    if (param.scope === "select-object" && selectOperand instanceof GroupedExpression) {
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

                    const predicateFn = exp.params[0] as FunctionExpression<boolean>;
                    const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: "where" };
                    const whereExp = this.visitFunction(predicateFn, [selectOperand.getItemExpression()], visitParam) as IExpression<boolean>;

                    if (whereExp.type !== Boolean) {
                        throw new Error(`Queryable<${objectOperand.itemType.name}>.where required predicate with boolean return value.`);
                    }

                    selectOperand.addWhere(whereExp);
                    return selectOperand;
                }
                case "contains": {
                    // TODO: dbset1.where(o => dbset2.select(c => c.column).contains(o.column)); use inner join for this
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    let item = exp.params[0];
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
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    objectOperand.distinct = true;
                    return objectOperand;
                }
                case "orderBy": {
                    const selectors = exp.params as ArrayValueExpression[];
                    const orders: IOrderExpression[] = [];
                    for (const selector of selectors) {
                        const selectorFn = selector.items[0] as FunctionExpression;
                        const direction = selector.items[1] ? selector.items[1] as ValueExpression<OrderDirection> : new ValueExpression<OrderDirection>("ASC");
                        const visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: exp.methodName };
                        const selectExp = this.visitFunction(selectorFn, [objectOperand.getItemExpression()], visitParam) as IColumnExpression;

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
                        let takeJoinRel = objectOperand.joins.ofType(PagingJoinRelation).first();
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
                            replaceExpression(orderJoinRel.relation, (exp) => {
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
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    const countExp = new MethodCallExpression(objectOperand as IExpression<T>, exp.methodName, objectOperand.entity.primaryColumns, Number);
                    const parentRel = selectOperand.parentRelation as JoinRelation;
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
                        if (parentRel) {
                            for (const relCol of parentRel.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }
                        const groupExp = new GroupByExpression(selectOperand, objExp);
                        groupExp.isAggregate = true;
                        const column = new ComputedColumnExpression(groupExp.entity, countExp, this.newAlias("column"));
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (parentRel.isManyToManyRelation) {
                            // alter relation to: parent -> bridge -> groupExp
                            const parentSelect = parentRel.parent;
                            parentSelect.joins.remove(parentRel);

                            const bridge = new SelectExpression(parentSelect.entity.clone());
                            this.setDefaultBehaviour(bridge);
                            bridge.entity.alias = this.newAlias();
                            bridge.selects = [];

                            const replaceMap = new Map();
                            mapReplaceExp(replaceMap, parentSelect.entity, bridge.entity);
                            mapKeepExp(replaceMap, groupExp);
                            // relation bridge -> groupExp
                            bridge.addJoin(groupExp, parentRel.relation.clone(replaceMap), parentRel.type);

                            // group the bridge so it could be easily join to parent
                            const bridgeAggreateExp = new MethodCallExpression(bridge, "sum", [column], Number);
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            bridgeColumn.isNullable = false;

                            const groupKey = new ObjectValueExpression({});
                            // add join from parent to bridge
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = Enumerable.from(parentSelect.projectedColumns).first(o => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregate = true;

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
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    if (exp.params.length > 0) {
                        const selectorFn = exp.params[0] as FunctionExpression;
                        const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: param.scope };
                        const selectExpression = this.visit(new MethodCallExpression(objectOperand, "select", [selectorFn]), visitParam) as SelectExpression;
                        param.selectExpression = visitParam.selectExpression;

                        if (!isValueType(selectExpression.itemType))
                            throw new Error(`Queryable<${selectOperand.type.name}> required select with basic type return value.`);

                        selectOperand = selectExpression;
                    }
                    const aggregateExp = new MethodCallExpression(selectOperand as unknown as IExpression<T>, exp.methodName, selectOperand.selects.select(o => {
                        if (o instanceof ComputedColumnExpression)
                            return o.expression;
                        return o;
                    }).toArray(), Number);
                    const parentRel = selectOperand.parentRelation as JoinRelation;
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
                        if (parentRel) {
                            for (const relCol of parentRel.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }
                        const groupExp = new GroupByExpression(selectOperand, objExp);
                        groupExp.isAggregate = true;
                        const column = new ComputedColumnExpression(groupExp.entity, aggregateExp, this.newAlias("column"));
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (parentRel.isManyToManyRelation) {
                            // alter relation to: parent -> bridge -> groupExp
                            const parentSelect = parentRel.parent;
                            parentSelect.joins.remove(parentRel);

                            const bridge = new SelectExpression(parentSelect.entity.clone());
                            this.setDefaultBehaviour(bridge);
                            bridge.entity.alias = this.newAlias();
                            bridge.selects = [];

                            const replaceMap = new Map();
                            mapReplaceExp(replaceMap, parentSelect.entity, bridge.entity);
                            mapKeepExp(replaceMap, groupExp);
                            // relation bridge -> groupExp
                            bridge.addJoin(groupExp, parentRel.relation.clone(replaceMap), parentRel.type);

                            // group the bridge so it could be easily join to parent
                            const bridgeAggreateExp = new MethodCallExpression(bridge as unknown as IExpression<T>, exp.methodName, [column], Number);
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            bridgeColumn.isNullable = false;

                            const groupKey = new ObjectValueExpression({});
                            // add join from parent to bridge
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = Enumerable.from(parentSelect.projectedColumns).first(o => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregate = true;

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
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    const isAny = exp.methodName === "any";
                    if (!isAny && exp.params.length <= 0) {
                        throw new QueryBuilderError(QueryBuilderErrorCode.UsageIssue, "All required 1 parameter");
                    }

                    if (exp.params.length > 0) {
                        let predicateFn = exp.params[0] as FunctionExpression;
                        if (!isAny)
                            predicateFn.body = new NotExpression(predicateFn.body);
                        const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: param.scope };
                        this.visit(new MethodCallExpression(selectOperand, "where", [predicateFn]), visitParam);
                    }

                    const anyExp = new ValueExpression(isAny);
                    const parentRel = selectOperand.parentRelation as JoinRelation;
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
                        if (parentRel) {
                            for (const relCol of parentRel.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }
                        const groupExp = new GroupByExpression(selectOperand, objExp);
                        groupExp.isAggregate = true;
                        const column = new ComputedColumnExpression(groupExp.entity, anyExp, this.newAlias("column"));
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (parentRel.isManyToManyRelation) {
                            // alter relation to: parent -> bridge -> groupExp
                            const parentSelect = parentRel.parent;
                            parentSelect.joins.remove(parentRel);

                            const bridge = new SelectExpression(parentSelect.entity.clone());
                            this.setDefaultBehaviour(bridge);
                            bridge.entity.alias = this.newAlias();
                            bridge.selects = [];

                            const replaceMap = new Map();
                            mapReplaceExp(replaceMap, parentSelect.entity, bridge.entity);
                            mapKeepExp(replaceMap, groupExp);
                            // relation bridge -> groupExp
                            let bridgeCurRelation = parentRel.relation.clone(replaceMap);
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
                            bridgeColumn.isNullable = false;

                            const groupKey = new ObjectValueExpression({});
                            // add join from parent to bridge
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = Enumerable.from(parentSelect.projectedColumns).first(o => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregate = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation, "LEFT");
                            groupedBridge.selects.add(bridgeColumn);

                            return new StrictEqualExpression(bridgeColumn, new ValueExpression(1));
                        }

                        const parentCol = new ColumnExpression(column.entity, column.type, column.propertyName, column.columnName, column.isPrimary, column.isNullable);
                        return new (isAny ? StrictNotEqualExpression : StrictEqualExpression)(parentCol, new ValueExpression(null));
                    }
                }
                case "first": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    if (exp.params.length > 0) {
                        const predicateFn = exp.params[0] as FunctionExpression;
                        const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: exp.methodName };
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
                        groupExp.isAggregate = true;
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
                    let paramExp = this.visit(exp.params[0] as ParameterExpression<number>, param);
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

                        if (exp.methodName === "skip") {
                            if (selectOperand.paging.take) {
                                selectOperand.paging.take = this.visit(new SubstractionExpression(selectOperand.paging.take, paramExp), param);
                                paramExp = this.visit(exp.params[0] as ParameterExpression<number>, param);
                            }
                            selectOperand.paging.skip = this.visit(selectOperand.paging.skip ? new AdditionExpression(selectOperand.paging.skip, paramExp) : paramExp, param);
                        }
                        else {
                            selectOperand.paging.take = this.visit(selectOperand.paging.take ? new MethodCallExpression(new ValueExpression(Math), "min", [selectOperand.paging.take, paramExp]) : paramExp, param);
                        }
                    }
                    else {
                        let takeJoinRel = objectOperand.joins.ofType(PagingJoinRelation).first();
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

                        if (exp.methodName === "skip") {
                            takeJoinRel.start = this.visit(takeJoinRel.start ? new AdditionExpression(takeJoinRel.start, paramExp) : paramExp, param);
                        }
                        else {
                            takeJoinRel.end = this.visit(takeJoinRel.start ? new AdditionExpression(takeJoinRel.start, paramExp) : paramExp, param);
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
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    const parentRelation = objectOperand.parentRelation;
                    const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: exp.methodName };
                    const childSelectOperand: SelectExpression = this.visit(exp.params[0], visitParam) as any;
                    param.selectExpression = visitParam.selectExpression;

                    let entityExp: IEntityExpression;
                    switch (exp.methodName) {
                        case "union":
                            const isUnionAll = exp.params[1];
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
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    const parentRelation = objectOperand.parentRelation;
                    const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: "join" };
                    const childSelectOperand: SelectExpression = this.visit(exp.params[0], visitParam) as any;

                    const relationSelector = exp.params[1] as FunctionExpression<boolean>;
                    let relation = this.visitFunction(relationSelector, [selectOperand.getItemExpression(), childSelectOperand.getItemExpression()], visitParam);

                    let jointType: JoinType;
                    switch (exp.methodName) {
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

                    if (exp.methodName === "groupJoin") {
                        childSelectOperand.parentRelation = new JoinRelation(selectOperand, childSelectOperand, relation, jointType);
                    }
                    else {
                        selectOperand.addJoin(childSelectOperand, relation, jointType);
                    }

                    const resultVisitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: "join" };
                    const resultSelector = exp.params[3] as FunctionExpression;
                    this.scopeParameters.add(resultSelector.params[1].name, exp.methodName === "groupJoin" ? childSelectOperand : childSelectOperand.getItemExpression());
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
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);

                    const parentRelation = objectOperand.parentRelation;

                    const dimensions = exp.params[0] as FunctionExpression;
                    const metrics = exp.params[1] as FunctionExpression;

                    // groupby
                    let visitParam: IQueryVisitParameter = { selectExpression: objectOperand, scope: exp.methodName };
                    const groupExp: GroupByExpression = this.visit(new MethodCallExpression(objectOperand, "groupBy", [dimensions]), visitParam) as any;
                    param.selectExpression = visitParam.selectExpression;

                    const dObject = (dimensions.body as ObjectValueExpression<any>).object;
                    const mObject = (metrics.body as ObjectValueExpression<any>).object;
                    const dmObject: { [key: string]: IExpression } = {};
                    for (const prop in dObject) {
                        dmObject[prop] = new MemberAccessExpression(new MemberAccessExpression(metrics.params[0], "key"), prop);
                    }
                    for (const prop in mObject)
                        dmObject[prop] = mObject[prop];

                    // select
                    const selectorFn = new FunctionExpression(new ObjectValueExpression(dmObject), metrics.params);
                    this.scopeParameters.add(dimensions.params[0].name, groupExp.key);
                    this.scopeParameters.add(selectorFn.params[0].name, groupExp.getItemExpression());
                    visitParam = { selectExpression: groupExp, scope: exp.methodName };
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
                    if (objectOperand instanceof GroupedExpression) {
                        const groupExp = objectOperand.groupByExp;
                        const entityExp = objectOperand.entity.clone();
                        entityExp.alias = this.newAlias();
                        const selectExp = new SelectExpression(entityExp);
                        selectExp.selects = objectOperand.selects.select(o => entityExp.columns.first(c => c.propertyName === o.propertyName)).toArray();

                        let relation: IExpression<boolean>;
                        const cloneMap = new Map();
                        mapReplaceExp(cloneMap, objectOperand.entity, entityExp);
                        for (const col of groupExp.groupBy) {
                            const childCol = col instanceof ComputedColumnExpression ? col.clone(cloneMap) : entityExp.columns.first(o => o.propertyName === col.propertyName);
                            const logicalExp = new StrictEqualExpression(col, childCol);
                            relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                        }
                        groupExp.addJoin(selectExp, relation, "LEFT");
                        return selectExp;
                    }
                    return objectOperand;
                }
            }
            throw new Error(`${exp.methodName} not supported on expression`);
        }
        else {
            exp.params = exp.params.select(o => this.visit(o, { selectExpression: param.selectExpression })).toArray();

            const isObjectOperandSafe = this.isSafe(objectOperand);
            const isExpressionSafe = isObjectOperandSafe && exp.params.all(o => this.isSafe(o));

            let translator;
            if (objectOperand instanceof ValueExpression) {
                translator = this.translator.resolve(objectOperand.value, exp.methodName);
                if (translator && (!isExpressionSafe || translator.isTranslate(exp))) {
                    return exp;
                }
            }
            if (!translator && objectOperand.type) {
                translator = this.translator.resolve(objectOperand.type.prototype, exp.methodName);
                if (translator && (!isExpressionSafe || translator.isTranslate(exp))) {
                    return exp;
                }
            }

            // Execute in app if all parameter is available.
            if (isExpressionSafe) {
                let hasParam = false;
                [exp.objectOperand, hasParam] = this.extract(exp.objectOperand);
                exp.params = exp.params.select(o => {
                    const [res, isParam] = this.extract(o);
                    hasParam = hasParam || isParam;
                    return res;
                }).toArray();
                if (hasParam) {
                    const result = this.createParamBuilderItem(exp, param);
                    return result;
                }

                return new ValueExpression(this.valueTransformer.execute(exp));
            }

            const oriObjectOperand = isObjectOperandSafe ? this.extractValue(objectOperand) : objectOperand;
            const methodFn: () => any = oriObjectOperand instanceof ValueExpression ? oriObjectOperand.value[exp.methodName] : objectOperand.type.prototype[exp.methodName];
            if (methodFn && !isNativeFunction(methodFn)) {
                // try convert user defined method to a FunctionExpression and built it as a query.
                const methodExp = ExpressionBuilder.parse(methodFn);
                methodExp.params.unshift(new ParameterExpression("this", exp.objectOperand.type));
                const params = [exp.objectOperand].concat(exp.params);
                const result = this.visitFunction(methodExp, params, { selectExpression: param.selectExpression });
                return result;
            }
        }
        throw new Error(`${exp.methodName} not supported.`);
    }
    protected visitFunctionCall<T>(exp: FunctionCallExpression<T>, param: IQueryVisitParameter): IExpression {
        exp.fnExpression = this.visit(exp.fnExpression, param);
        if (!(exp.fnExpression instanceof ValueExpression)) {
            throw new Error("Function call expect a function");
        }

        exp.params = exp.params.select((o) => this.visit(o, param)).toArray();
        const fn = exp.fnExpression.value as (...params: []) => T;

        const isExpressionSafe = exp.params.all(o => this.isSafe(o));
        let translator = this.translator.resolve(fn);
        if (translator && (!isExpressionSafe || translator.isTranslate(exp)))
            return exp;

        // Execute function in application if all it's parameters available in application.
        if (isExpressionSafe) {
            let hasParam = false;
            exp.params = exp.params.select(o => {
                const [res, isParam] = this.extract(o);
                hasParam = hasParam || isParam;
                return res;
            }).toArray();
            if (hasParam) {
                const result = this.createParamBuilderItem(exp, param);
                return result;
            }

            return new ValueExpression(this.valueTransformer.execute(exp));
        }

        // Try convert function as Expression
        if (!isNativeFunction(fn)) {
            const functionExp = ExpressionBuilder.parse(fn);
            const result = this.visitFunction(functionExp, exp.params, { selectExpression: param.selectExpression });
            return result;
        }
        return exp;
    }
    protected visitBinaryOperator(exp: IBinaryOperatorExpression, param: IQueryVisitParameter): IExpression {
        exp.leftOperand = this.visit(exp.leftOperand, param);
        exp.rightOperand = this.visit(exp.rightOperand, param);

        const isExpressionSafe = this.isSafe(exp.leftOperand) && this.isSafe(exp.rightOperand);
        if (isExpressionSafe) {
            let hasParam = false;
            let hasParam2 = false;
            [exp.leftOperand, hasParam] = this.extract(exp.leftOperand);
            [exp.rightOperand, hasParam2] = this.extract(exp.rightOperand);
            if (hasParam || hasParam2) {
                const result = this.createParamBuilderItem(exp, param);
                return result;
            }

            return new ValueExpression(this.valueTransformer.execute(exp));
        }

        if (exp.leftOperand instanceof TernaryExpression) {
            const ternaryExp = exp.leftOperand as TernaryExpression;
            const falseOperand = exp.clone();
            falseOperand.leftOperand = ternaryExp.falseResultOperand;
            const trueOperand = exp.clone();
            trueOperand.leftOperand = ternaryExp.trueResultOperand;
            return new TernaryExpression(ternaryExp.logicalOperand, this.visit(trueOperand, param), this.visit(falseOperand, param));
        }
        else if (exp.rightOperand instanceof TernaryExpression) {
            const ternaryExp = exp.rightOperand as TernaryExpression;
            const falseOperand = exp.clone();
            falseOperand.rightOperand = ternaryExp.falseResultOperand;
            const trueOperand = exp.clone();
            trueOperand.rightOperand = ternaryExp.trueResultOperand;
            return new TernaryExpression(ternaryExp.logicalOperand, this.visit(trueOperand, param), this.visit(falseOperand, param));
        }

        return exp;
    }
    protected visitUnaryOperator(exp: IUnaryOperatorExpression, param: IQueryVisitParameter): IExpression {
        exp.operand = this.visit(exp.operand, param);

        const isExpressionSafe = this.isSafe(exp.operand);
        if (isExpressionSafe) {
            let hasParam = false;
            [exp.operand, hasParam] = this.extract(exp.operand);
            if (hasParam) {
                const result = this.createParamBuilderItem(exp, param);
                return result;
            }
            return new ValueExpression(this.valueTransformer.execute(exp));
        }

        if (exp.operand instanceof TernaryExpression) {
            const ternaryExp = exp.operand as TernaryExpression;
            const falseOperand = exp.clone();
            falseOperand.operand = ternaryExp.falseResultOperand;
            const trueOperand = exp.clone();
            trueOperand.operand = ternaryExp.trueResultOperand;
            return new TernaryExpression(ternaryExp.logicalOperand, trueOperand, falseOperand);
        }
        return exp;
    }
    protected visitTernaryOperator(expression: TernaryExpression<any>, param: IQueryVisitParameter): IExpression {
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
            return new ValueExpression(this.valueTransformer.execute(expression));
        }
        return expression;
    }
    protected visitObjectLiteral<T extends { [Key: string]: IExpression } = any>(expression: ObjectValueExpression<T>, param: IQueryVisitParameter) {
        let requireCopy = false;
        let requireAlias = param.scope !== "groupBy";
        switch (param.scope) {
            case "groupBy":
            case "select-object": {
                requireCopy = true;
                break;
            }
            case "select": {
                break;
            }
            default: {
                throw new Error("Operation not supported");
            }
        }

        const selectExp = param.selectExpression;
        const isGrouped = selectExp instanceof GroupByExpression;
        const entityExp = selectExp.entity;

        let embeddedEntity = entityExp;
        let embeddedSelect = selectExp;
        const possibleKeys: string[] = [];
        if (requireCopy) {
            embeddedEntity = entityExp.clone();
            embeddedSelect = new SelectExpression(embeddedEntity);

            if (selectExp instanceof GroupByExpression) {
                let clonedKey: IExpression;
                const cloneMap = new Map();
                mapReplaceExp(cloneMap, entityExp, embeddedEntity);
                if (isEntityExp(selectExp.key)) {
                    const keySelectExp = selectExp.key.select;
                    const clone = keySelectExp.clone(cloneMap);
                    clonedKey = clone.entity;
                    mapReplaceExp(cloneMap, selectExp.key, clonedKey);
                    clone.parentRelation = (keySelectExp.parentRelation as IncludeRelation).clone(cloneMap);
                }
                else {
                    clonedKey = selectExp.key.clone(cloneMap);
                }

                embeddedSelect = new GroupByExpression(embeddedSelect, clonedKey);
            }

            const oldParam = selectExp.getItemExpression();
            const embeddedParam = embeddedSelect.getItemExpression();
            for (const key of this.scopeParameters.keys) {
                const val = this.scopeParameters.get(key);
                if (val === oldParam) {
                    possibleKeys.push(key);
                    this.scopeParameters.add(key, embeddedParam);
                }
            }
        }

        const includes: IncludeRelation[] = [];
        const selects: IColumnExpression[] = [];
        for (const prop in expression.object) {
            let valExp = expression.object[prop];
            const litVisitParam = { selectExpression: embeddedSelect, scope: "select-object" };
            valExp = this.visit(valExp, litVisitParam);

            if (valExp instanceof SelectExpression) {
                if (isGrouped) {
                    if (valExp instanceof GroupedExpression && valExp.groupByExp === embeddedSelect) {
                        const parentGroupExp = embeddedSelect as GroupByExpression;
                        const childSelectExp = parentGroupExp.clone();
                        const childEntity = childSelectExp.entity;
                        childEntity.alias = this.newAlias();

                        const replaceMap1 = new Map();
                        mapReplaceExp(replaceMap1, entityExp, childEntity);
                        let relation: IExpression<boolean>;
                        for (const pCol of parentGroupExp.primaryKeys) {
                            const childCol = childSelectExp.primaryKeys.first(o => o.propertyName === pCol.propertyName);
                            const logicalExp = new StrictEqualExpression(pCol, childCol);
                            relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                        }
                        const include = embeddedSelect.addInclude(prop, childSelectExp, relation, "one");
                        embeddedSelect.includes.remove(include);
                        includes.push(include);
                    }
                    else {
                        const include = joinToInclude(valExp, embeddedSelect, prop, "many");
                        embeddedSelect.includes.remove(include);
                        includes.push(include);
                    }
                }
                else {
                    const include = joinToInclude(valExp, embeddedSelect, prop, "many");
                    embeddedSelect.includes.remove(include);
                    includes.push(include);
                }
            }
            else if (isEntityExp(valExp)) {
                if (valExp === embeddedSelect.entity) {
                    const childSelectExp = embeddedSelect.clone();
                    const entityClone = childSelectExp.entity;
                    entityClone.alias = this.newAlias();
                    let relation: IExpression<boolean>;
                    for (const pCol of entityClone.primaryColumns) {
                        const childCol = valExp.primaryColumns.first(o => o.propertyName === pCol.propertyName);
                        const logicalExp = new StrictEqualExpression(pCol, childCol);
                        relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                    }
                    const include = embeddedSelect.addInclude(prop, childSelectExp, relation, "one");
                    embeddedSelect.includes.remove(include);
                    includes.push(include);
                }
                else {
                    const childSelectExp = valExp.select!;
                    const include = joinToInclude(childSelectExp, embeddedSelect, prop, "one");
                    embeddedSelect.includes.remove(include);
                    includes.push(include);
                }
            }
            else if (isColumnExp(valExp)) {
                let columnExp: IColumnExpression;
                // TODO: should check reference instead
                if (valExp instanceof ComputedColumnExpression && valExp.entity.alias !== embeddedEntity.alias) {
                    columnExp = new ColumnExpression(valExp.entity, valExp.type, prop, valExp.dataPropertyName, valExp.isPrimary, valExp.isNullable);
                }
                else {
                    const cloneMap = new Map();
                    mapKeepExp(cloneMap, valExp.entity);
                    if (valExp instanceof ComputedColumnExpression) {
                        cloneMap.set(valExp.expression, valExp.expression);
                    }
                    columnExp = valExp.clone(cloneMap);
                    columnExp.propertyName = prop;
                }
                if (requireAlias && !columnExp.alias)
                    columnExp.alias = this.newAlias("column");
                selects.push(columnExp);
            }
            else {
                const columnExp = new ComputedColumnExpression(embeddedEntity, valExp, prop, this.newAlias("column"));
                // aggregated column should be not nullable
                if (valExp instanceof MethodCallExpression && valExp.type === Number) {
                    columnExp.isNullable = false;
                }
                selects.push(columnExp);
            }
        }

        embeddedSelect.selects = selects;
        embeddedSelect.includes = includes;
        embeddedSelect.itemExpression = expression;
        if (embeddedSelect instanceof GroupByExpression) {
            embeddedSelect.isAggregate = true;
        }

        if (requireCopy) {
            for (const key of possibleKeys) {
                this.scopeParameters.remove(key);
            }
            let relations: IExpression<boolean>;
            for (const pCol of selectExp.primaryKeys) {
                const embeddedCol = embeddedSelect.primaryKeys.first(o => o.propertyName === pCol.propertyName);
                const logicalExp = new StrictEqualExpression(pCol, embeddedCol);
                relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
            }
            selectExp.addJoin(embeddedSelect, relations, "INNER", true);
        }

        return embeddedSelect.entity;
    }
    //#endregion
}

const joinToInclude = <TChild, TParent>(childExp: SelectExpression<TChild>, parentExp: SelectExpression<TParent>, name: string, relationType: RelationshipType) => {
    let parentRel = childExp.parentRelation as JoinRelation<TParent, TChild>;
    while (parentRel && (parentRel as any).name === undefined && parentRel.parent !== parentExp) {
        const nextRel = parentRel.parent.parentRelation as JoinRelation<any, any>;
        parentRel.parent.joins.remove(parentRel);
        parentRel.child.addJoin(parentRel.parent, parentRel.relation, "INNER");
        if (!parentRel) break;
        parentRel = nextRel;
    }

    if (!parentRel)
        return null;

    parentExp.joins.remove(parentRel);
    const includeRel = parentExp.addInclude(name, childExp, parentRel.relation, relationType, parentRel.isEmbedded);
    return includeRel;
};

const reverseJoin = (childExp: SelectExpression, root?: SelectExpression, isExclusive?: boolean) => {
    if (root instanceof GroupedExpression) root = root.groupByExp;
    if (childExp === root) return childExp;
    let joinRels: JoinRelation[] = [];
    let selectExp = childExp;
    while (selectExp.parentRelation && selectExp.parentRelation instanceof JoinRelation && (!root || (!isExclusive ? selectExp !== root : selectExp.parentRelation.parent !== root))) {
        const joinRel = selectExp.parentRelation as JoinRelation;
        joinRels.push(joinRel);
        selectExp = joinRel.parent;
    }
    const rootRel = selectExp.parentRelation;
    for (const joinRel of joinRels) {
        const parent = joinRel.parent;
        const child = joinRel.child;
        parent.joins.remove(joinRel);
        if (joinRel.isEmbedded) {
            // turn parent into child by using all child selects and includes.
            const cloneMap = new Map();
            mapReplaceExp(cloneMap, child.entity, parent.entity);

            parent.selects = child.selects.select(o => {
                let col = Enumerable.from(parent.allColumns).first(c => c.dataPropertyName === o.dataPropertyName);
                if (!col) {
                    col = o.clone(cloneMap);
                }
                return col;
            }).toArray();
            parent.itemExpression = child.itemExpression;

            parent.includes = [];
            for (const include of child.includes) {
                mapKeepExp(cloneMap, include.child);
                parent.addInclude(include.name, include.child, include.relation.clone(cloneMap), include.type, include.isEmbedded);
            }
            for (const join of child.joins) {
                mapKeepExp(cloneMap, join.child);
                parent.addJoin(join.child, join.relation.clone(cloneMap), join.type, join.isEmbedded);
            }

            if (child === childExp) childExp = parent;
        }
        else {
            joinRel.child.addJoin(parent, joinRel.relation, "INNER", joinRel.isEmbedded);
        }
    }
    childExp.parentRelation = rootRel;
    if (rootRel) {
        rootRel.child = childExp;
    }
    return childExp;
};
