import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { JoinType, OrderDirection } from "../../Common/StringType";
import { ElementType, GenericType, IObjectType, MethodKey, SetterObj, StringKeyOf, ValueType } from "../../Common/Type";
import { QueryBuilderError, QueryBuilderErrorCode } from "../../Error/QueryBuilderError";
import { AdditionExpression } from "../../ExpressionBuilder/Expression/AdditionExpression";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { FunctionCallExpression } from "../../ExpressionBuilder/Expression/FunctionCallExpression";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { GreaterEqualExpression } from "../../ExpressionBuilder/Expression/GreaterEqualExpression";
import { GreaterThanExpression } from "../../ExpressionBuilder/Expression/GreaterThanExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { InstantiationExpression } from "../../ExpressionBuilder/Expression/InstantiationExpression";
import { IUnaryOperatorExpression } from "../../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { LessEqualExpression } from "../../ExpressionBuilder/Expression/LessEqualExpression";
import { LessThanExpression } from "../../ExpressionBuilder/Expression/LessThanExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { NotExpression } from "../../ExpressionBuilder/Expression/NotExpression";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { OrExpression } from "../../ExpressionBuilder/Expression/OrExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { SpreadExpression } from "../../ExpressionBuilder/Expression/SpreadExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { StrictNotEqualExpression } from "../../ExpressionBuilder/Expression/StrictNotEqualExpression";
import { SubstractionExpression } from "../../ExpressionBuilder/Expression/SubstractionExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { ExpressionExecutor } from "../../ExpressionBuilder/ExpressionExecutor";
import { TransformerParameter } from "../../ExpressionBuilder/TransformerParameter";
import { isBinaryExp, isColumnExp, isEntityExp, isMultiExp, isNativeFunction, isNotNull, isNull, isSelectExp, isUnaryExp, isValue, isValueType, reverseJoinType } from "../../Helper/Util";
import { createExpression, createExpression2, mapKeepExp } from "src/Helper/Expression";
import { mapReplaceExp } from "src/Helper/Expression";
import { resolveClone } from "src/Helper/Expression";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { EmbeddedRelationMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { IBaseRelationMetaData } from "../../MetaData/Interface/IBaseRelationMetaData";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryTranslatorItem } from "../../Query/IQueryTranslatorItem";
import { IQueryVisitor } from "../../Query/IQueryVisitor";
import { IQueryVisitContext } from "../../Query/IQueryVisitContext";
import { NamingStrategy } from "../../Query/NamingStrategy";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { IncludeRelation } from "../../Queryable/Interface/IncludeRelation";
import { JoinRelation } from "../../Queryable/Interface/JoinRelation";
import { PagingJoinRelation } from "../../Queryable/Interface/PagingJoinRelation";
import { Queryable } from "../../Queryable/Queryable.internal";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { ComputedColumnExpression } from "../../Queryable/QueryExpression/ComputedColumnExpression";
import { EntityExpression } from "../../Queryable/QueryExpression/EntityExpression";
import { ExceptExpression } from "../../Queryable/QueryExpression/ExceptExpression";
import { GroupByExpression } from "../../Queryable/QueryExpression/GroupByExpression";
import { GroupedExpression } from "../../Queryable/QueryExpression/GroupedExpression";
import { IColumnExpression } from "../../Queryable/QueryExpression/IColumnExpression";
import { IEntityExpression } from "../../Queryable/QueryExpression/IEntityExpression";
import { IntersectExpression } from "../../Queryable/QueryExpression/IntersectExpression";
import { IOrderExpression } from "../../Queryable/QueryExpression/IOrderExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../../Queryable/QueryExpression/SqlParameterExpression";
import { UnionExpression } from "../../Queryable/QueryExpression/UnionExpression";
import { Enumerable } from "@elcy/enumerable";
import { getColumnMetadata, getRelationMetadata } from "src/MetaData/MetaDataMapper";
import { ConcatExpression } from "src/Queryable/QueryExpression/ConcatExpression";
import { ProjectionEntityExpression } from "src/Queryable/QueryExpression/ProjectionEntityExpression";
import { TSchema } from "src/Queryable/QueryExpression/SqlTableValueParameterExpression";
import { NullCoalesceExpression } from "src/ExpressionBuilder/Expression/NullCoalesceExpression";
import { IMultiOperatorExpression } from "src/ExpressionBuilder/Expression/IMultiOperatorExpression";

export class RelationalQueryVisitor implements IQueryVisitor {
    constructor() {
        this.queryOption = {};
        this.valueTransformer = new ExpressionExecutor();
        this.scopeParameters = new TransformerParameter();
    }
    public namingStrategy: NamingStrategy;
    public parameterIndex: number;
    public queryOption: IQueryOption;
    public scopeParameters: TransformerParameter;
    public translator: QueryTranslator;
    public valueTransformer: ExpressionExecutor;
    private aliasObj: { [key: string]: number } = {};
    public newAlias(type: "entity" | "column" | "param" = "entity") {
        if (!this.aliasObj[type]) {
            this.aliasObj[type] = 0;
        }
        return this.namingStrategy.getAlias(type) + this.aliasObj[type]++;
    }

    public setDefaultBehaviour<TE extends object>(selectExp: SelectExpression<TE>) {
        const entityExp = selectExp.entity;
        if (entityExp.deleteColumn && !this.queryOption.includeSoftDeleted) {
            selectExp.addWhere(new StrictEqualExpression(entityExp.deleteColumn, new ValueExpression(false)));
        }

        if (selectExp.orders.length <= 0 && entityExp.defaultOrders.length > 0) {
            const context: IQueryVisitContext = {
                selectExpression: selectExp,
                scope: "orderBy"
            };
            this.visit(new MethodCallExpression(selectExp, "orderBy" as MethodKey<TE[]>, entityExp.defaultOrders), context);
        }
    }
    public setParameter(flatParameterStacks: { [key: string]: unknown }) {
        this.scopeParameters.clear();
        this.valueTransformer.scopeParameters.clear();
        if (flatParameterStacks) {
            this.scopeParameters.set(flatParameterStacks);
            this.valueTransformer.scopeParameters.set(flatParameterStacks);
        }
    }

    //#region visit parameter
    public visit<T>(exp: IExpression<T>, context: IQueryVisitContext): IExpression<T> {
        switch (true) {
            case exp instanceof MethodCallExpression:
                return this.visitMethod(exp, context);
            case exp instanceof MemberAccessExpression:
                return this.visitMember(exp, context);
            case exp instanceof FunctionCallExpression:
                return this.visitFunctionCall(exp as FunctionCallExpression<T>, context);
            case exp instanceof InstantiationExpression:
                return this.visitInstantiation(exp as InstantiationExpression<T>, context);
            case exp instanceof TernaryExpression:
                return this.visitTernaryOperator(exp as TernaryExpression<T>, context);
            case exp instanceof ObjectValueExpression:
                return this.visitObjectLiteral(exp as ObjectValueExpression<Extract<T, object>>, context);
            case exp instanceof FunctionExpression:
                return this.visitFunction(exp as FunctionExpression<T>, [], context);
            case exp instanceof ParameterExpression:
                return this.visitParameter(exp as ParameterExpression<T>, context);
            case isBinaryExp<T>(exp):
                return this.visitBinaryOperator(exp, context);
            case isMultiExp<T>(exp):
                return this.visitMultiOperator(exp, context);
            case isUnaryExp<T>(exp):
                return this.visitUnaryOperator(exp, context);
            case exp instanceof ArrayValueExpression:
                throw new Error(`literal Array not supported`);
            default:
                console.log(`FOUND: ${exp?.constructor.name}`);
                return exp;
        }
    }
    public visitFunction<T, TArgs extends readonly unknown[]>(exp: FunctionExpression<T, TArgs>, parameters: { [K in keyof TArgs]: IExpression<TArgs[K]>; }, context: IQueryVisitContext): IExpression<T> {
        let i = 0;
        for (const paramExp of exp.params) {
            this.scopeParameters.add(paramExp.name, parameters[i++]);
        }
        const result = this.visit(exp.body, context);
        for (const paramExp of exp.params) {
            this.scopeParameters.remove(paramExp.name);
        }
        return result;
    }
    protected isSafe(exp: IExpression) {
        if (exp instanceof SqlParameterExpression) {
            return true;
        }
        return exp instanceof ValueExpression;
    }
    protected visitBinaryOperator<T, TE>(exp: IBinaryOperatorExpression<T>, context: IQueryVisitContext): IExpression<T> {
        const leftOperand = this.visit(exp.leftOperand, context);
        const rightOperand = this.visit(exp.rightOperand, context);

        const visitedExp = exp.clone(new Map([[exp.leftOperand, leftOperand], [exp.rightOperand, rightOperand]]));
        const isExpressionSafe = this.isSafe(leftOperand) && this.isSafe(rightOperand);
        if (isExpressionSafe) {
            let hasParam = false;
            if (leftOperand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(context.selectExpression.paramExps, leftOperand);
                visitedExp.leftOperand = leftOperand.valueExp;
                hasParam = true;
            }
            if (rightOperand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(context.selectExpression.paramExps, rightOperand);
                visitedExp.rightOperand = rightOperand.valueExp;
                hasParam = true;
            }
            if (hasParam) {
                return context.selectExpression.addSqlParameter(visitedExp);
            }

            return new ValueExpression(this.valueTransformer.execute(visitedExp));
        }

        return visitedExp;
    }
    protected visitMultiOperator<T, TE>(exp: IMultiOperatorExpression<T>, context: IQueryVisitContext): IExpression<T> {
        const visitedExp = exp.clone(Enumerable.from(exp.operands).toMap(o => o, o => this.visit(o, context)));
        const isExpressionSafe = visitedExp.operands.every(o => this.isSafe(o));
        if (isExpressionSafe) {
            let hasParam = false;
            visitedExp.operands = visitedExp.operands.map(o => {
                if (o instanceof SqlParameterExpression) {
                    ArrayExtension.deleteLast(context.selectExpression.paramExps, o);
                    hasParam = true;
                    return o.valueExp;
                }

                return o;
            });

            if (hasParam) {
                return context.selectExpression.addSqlParameter(visitedExp);
            }

            return new ValueExpression(this.valueTransformer.execute(visitedExp));
        }

        return visitedExp;
    }
    protected visitFunctionCall<T>(exp: FunctionCallExpression<T>, context: IQueryVisitContext): IExpression<T> {
        const fnExpression = this.visit(exp.fnExpression, context);
        if (!(fnExpression instanceof ValueExpression)) {
            throw new Error("Function call expect a function");
        }

        const params = exp.params.map((o) => this.visit(o, context));

        const visitedExp = new FunctionCallExpression<T>(fnExpression, params, exp.functionName);
        const isExpressionSafe = visitedExp.params.every((o) => this.isSafe(o));

        const fn = fnExpression.value as (...params: unknown[]) => T;
        const translator = this.translator.resolve(fn);
        if (translator && (!isExpressionSafe || translator.isTranslate(visitedExp))) {
            return visitedExp;
        }

        // Execute function in application if all it's parameters available in application.
        if (isExpressionSafe) {
            let hasParam = false;
            visitedExp.params = visitedExp.params.map((o) => {
                if (o instanceof SqlParameterExpression) {
                    ArrayExtension.deleteLast(context.selectExpression.paramExps, o);
                    hasParam = true;
                    return o.valueExp;
                }
                return o;
            });

            if (hasParam) {
                return context.selectExpression.addSqlParameter(visitedExp);
            }

            return new ValueExpression(this.valueTransformer.execute(visitedExp));
        }

        // Try convert function as Expression
        if (!isNativeFunction(fn)) {
            const functionExp = ExpressionBuilder.parse(fn);
            const result = this.visitFunction(functionExp, visitedExp.params, { selectExpression: context.selectExpression });
            return result;
        }
        return visitedExp;
    }
    protected visitInstantiation<T>(exp: InstantiationExpression<T>, context: IQueryVisitContext): IExpression<T> {
        const typeOperand = this.visit(exp.typeOperand, context) as ValueExpression<IObjectType<T>>;
        const params = exp.params.map((o) => this.visit(o, context));

        const visitedExp = new InstantiationExpression(typeOperand, params);
        const isExpressionSafe = this.isSafe(typeOperand) && params.every((o) => this.isSafe(o));
        const translator = this.translator.resolve(typeOperand.value);
        if (translator && (!isExpressionSafe || translator.isTranslate(visitedExp))) {
            return visitedExp;
        }

        if (isExpressionSafe) {
            let hasParam = false;
            visitedExp.params = params.map((o) => {
                if (o instanceof SqlParameterExpression) {
                    ArrayExtension.deleteLast(context.selectExpression.paramExps, o);
                    hasParam = true;
                    return o.valueExp;
                }
                return o;
            });

            if (hasParam) {
                return context.selectExpression.addSqlParameter(visitedExp);
            }

            return new ValueExpression(this.valueTransformer.execute(visitedExp));
        }

        throw new Error(`${exp.type.name} not supported.`);
    }
    protected visitMember<TE extends object, K extends StringKeyOf<TE>, T extends TE[K]>(exp: MemberAccessExpression<TE, K, T>, context: IQueryVisitContext): IExpression<T> {
        const objectOperand = this.visit(exp.objectOperand, context);
        if (objectOperand instanceof TernaryExpression) {
            const trueOperand = new MemberAccessExpression(objectOperand.trueOperand, exp.memberName, exp.type);
            const falseOperand = new MemberAccessExpression(objectOperand.falseOperand, exp.memberName, exp.type);
            return new TernaryExpression(objectOperand.logicalOperand, this.visit(trueOperand, context), this.visit(falseOperand, context));
        }

        if (exp.memberName === "prototype" || exp.memberName === "__proto__") {
            throw new Error(`property ${exp.memberName} not supported in linq to sql.`);
        }

        if (isEntityExp<TE>(objectOperand)) {
            let column = objectOperand.properties[exp.memberName] as IColumnExpression<TE, T>;
            if (!column) {
                // computed column need to be finalize before can be used
                const computedColumnMeta = getColumnMetadata(objectOperand.type as IObjectType<TE>, exp.memberName);
                if (computedColumnMeta instanceof ComputedColumnMetaData) {
                    const result = this.visitFunction(computedColumnMeta.functionExpression, [objectOperand], { selectExpression: context.selectExpression });
                    if (result instanceof EntityExpression || result instanceof SelectExpression) {
                        throw new Error(`${objectOperand.type.name}.${exp.memberName} not supported`);
                    }

                    const computedColumnExp = new ComputedColumnExpression(objectOperand as IEntityExpression<TE>, result, exp.memberName);
                    objectOperand.properties[column.propertyName] = computedColumnExp;
                    column = computedColumnExp;
                }
            }

            if (column) {
                return column;
            }

            if (objectOperand instanceof ProjectionEntityExpression) {
                const selectExp = objectOperand.subSelect;
                const include = selectExp.includes.find((c) => c.name === exp.memberName);
                if (include) {
                    const replaceMap = new Map();
                    const child = include.child.clone(replaceMap);
                    mapReplaceExp(replaceMap, selectExp.entity, objectOperand);
                    const relation = include.relation.clone(replaceMap);

                    switch (context.scope) {
                        case "withRelated": {
                            selectExp.addInclude(include.name, child, relation, include.type, include.isEmbedded);
                            return include.type === "many" ? child as unknown as IExpression<T> : child.entity as IExpression<T>;
                        }
                        default: {
                            let joinType: JoinType = "LEFT";
                            if (include.type === "one" && context.scope === "filter") {
                                joinType = "INNER";
                            }

                            selectExp.addJoin(child, relation, joinType, include.isEmbedded);
                            return include.type === "many" ? child as unknown as IExpression<T> : child.entity as IExpression<T>;
                        }
                    }
                }
            }

            const relationMeta: IBaseRelationMetaData<TE, Extract<T, object>> = getRelationMetadata(objectOperand.type as IObjectType<TE>, exp.memberName);
            if (relationMeta) {
                switch (context.scope) {
                    case "withRelated": {
                        const existingRel = context.selectExpression.includes.find(o => o.name === exp.memberName);
                        if (existingRel) {
                            throw "unexpected";
                        }
                        break;
                    }
                    default: {
                        if (relationMeta.relationType === "one") {
                            const joinRel = context.selectExpression.joins.find(o => o.child.type === relationMeta.target.type);
                            if (joinRel) {
                                return joinRel.child;
                            }
                        }
                        break;
                    }
                }

                const targetType = relationMeta.target.type;
                const entityExp = new EntityExpression(targetType, this.newAlias());
                if (relationMeta instanceof EmbeddedRelationMetaData) {
                    for (const propKey in entityExp.properties) {
                        const col = entityExp.properties[propKey];
                        col.columnName = relationMeta.prefix + col.columnName;
                    }
                    entityExp.name = objectOperand.name;
                }
                const childExp = new SelectExpression(entityExp);
                this.setDefaultBehaviour(childExp);

                switch (context.scope) {
                    case "withRelated": {
                        context.selectExpression.addInclude(exp.memberName, childExp, relationMeta);
                        return relationMeta.relationType === "many" ? childExp as unknown as IExpression<T> : childExp.entity;
                    }
                    default: {
                        const joinRel = new JoinRelation(objectOperand, entityExp, relationMeta);
                        context.selectExpression.joins.push(joinRel);
                        return relationMeta.relationType === "many" ? childExp as unknown as IExpression<T> : childExp.entity;
                    }
                }
            }
        }
        else if (isSelectExp<ElementType<TE>>(objectOperand) && exp.memberName === "length") {
            if (context.scope === "withRelated") {
                throw "unexpected";
            }

            return this.visit(new MethodCallExpression(objectOperand, "count", []), context);
        }
        else if (objectOperand instanceof GroupedExpression) {
            if (exp.memberName === "key") {
                return objectOperand.key;
            }
        }
        else if (objectOperand instanceof SqlParameterExpression) {
            ArrayExtension.deleteLast(context.selectExpression.paramExps, objectOperand);
            exp.objectOperand = objectOperand.valueExp;
            return context.selectExpression.addSqlParameter(exp);
        }
        else {
            let translator;
            const isExpressionSafe = this.isSafe(objectOperand);

            const visitedExp = new MemberAccessExpression(objectOperand, exp.memberName, exp.type);
            if (objectOperand instanceof ValueExpression) {
                translator = this.translator.resolve(objectOperand.value, exp.memberName);
            }
            if (!translator && objectOperand.type) {
                translator = this.translator.resolve(objectOperand.type.prototype, exp.memberName);
            }
            if (translator && (!isExpressionSafe || translator.isTranslate(visitedExp))) {
                return visitedExp;
            }

            // Execute in app if all parameter is available.
            if (isExpressionSafe) {
                if (objectOperand instanceof SqlParameterExpression) {
                    ArrayExtension.deleteLast(context.selectExpression.paramExps, objectOperand);
                    visitedExp.objectOperand = objectOperand.valueExp;
                    return context.selectExpression.addSqlParameter(visitedExp);
                }

                return new ValueExpression(this.valueTransformer.execute(visitedExp));
            }
        }

        throw new Error(`${objectOperand.type.name}.${exp.memberName} is invalid or not supported in linq to sql.`);
    }
    protected visitMethod<TE, K extends MethodKey<TE>, T>(exp: MethodCallExpression<TE, K, T>, context: IQueryVisitContext): IExpression<T> {
        let objectOperand = this.visit(exp.objectOperand, context);
        if (objectOperand instanceof TernaryExpression) {
            const trueOperand = new MethodCallExpression(objectOperand.trueOperand, exp.methodName, exp.params, exp.type);
            const falseOperand = new MethodCallExpression(objectOperand.falseOperand, exp.methodName, exp.params, exp.type);
            return new TernaryExpression(objectOperand.logicalOperand, this.visit(trueOperand, context), this.visit(falseOperand, context));
        }

        if (isSelectExp<ElementType<T>>(objectOperand)) {
            let objectSelectExp = objectOperand as unknown as SelectExpression<ElementType<TE>>;

            const objectOperandSelect = objectOperand;
            let selectOperand = objectOperandSelect;
            switch (exp.methodName) {
                case "groupBy": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    const parentRelation = objectOperand.parentRelation;
                    const selectorFn = exp.params[0] as FunctionExpression<T, [unknown]>;
                    const visitContext: IQueryVisitContext = {
                        selectExpression: selectOperand,
                        scope: exp.methodName
                    };
                    const selectExp = this.visitFunction(selectorFn, [selectOperand.getItemExpression()], visitContext) as IExpression<T & object>;
                    context.selectExpression = visitContext.selectExpression;

                    if (selectExp instanceof SelectExpression) {
                        throw new Error(`groupBy did not support selector which return array/queryable/enumerable.`);
                    }

                    let key = selectExp;
                    if (isEntityExp(selectExp)) {
                        const childSelectExp = selectExp.select;
                        if (childSelectExp === selectOperand) {
                            throw new Error(`groupBy did not support selector which return itselft.`);
                        }

                        reverseJoin(this, childSelectExp, selectOperand, true);
                        // remove relation to groupBy expression.
                        const parentRel = childSelectExp.parentRelation as JoinRelation<any, T & object>;
                        ArrayExtension.delete(parentRel.parent.joins, parentRel);
                    }
                    else if (isColumnExp(selectExp)) {
                        key = selectExp;
                    }
                    else {
                        key = new ComputedColumnExpression(selectOperand.entity, selectExp, "key" as StringKeyOf<ElementType<TE>>, this.newAlias("column"));
                    }

                    const groupByExp = new GroupByExpression(selectOperand, key);
                    if (parentRelation) {
                        parentRelation.child = groupByExp;
                        groupByExp.parentRelation = parentRelation;
                    }
                    else {
                        context.selectExpression = groupByExp;
                    }

                    return groupByExp as unknown as IExpression<T>;
                }
                case "map": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    const selectorFn = exp.params[0] as FunctionExpression<T, [unknown]>;
                    const visitContext: IQueryVisitContext = {
                        selectExpression: objectSelectExp,
                        scope: exp.methodName
                    };

                    const type = (exp.params[1] as ValueExpression<GenericType<T>>)?.value;
                    let selectorExp = this.visitFunction(selectorFn, [objectSelectExp.getItemExpression()], visitContext);
                    if (selectorExp === objectSelectExp.getItemExpression()) {
                        return objectSelectExp as unknown as IExpression<T>;
                    }
                    if (selectorExp instanceof ObjectValueExpression) {
                        objectOperandSelect.selects = [];
                        const entityExp = new ProjectionEntityExpression(objectOperandSelect as unknown as SelectExpression<ElementType<T>>, type);
                        const selectExp = new SelectExpression(entityExp);
                        const columnMap = new Map<IColumnExpression, IColumnExpression>();
                        for (const prop in selectorExp) {
                            const propExp = selectorExp[prop];
                            if (isSelectExp(propExp)) {
                                const joinRel = propExp.entity.parentJoin;
                                const relation = createExpression2(joinRel!.relation, joinRel.childColumns, joinRel.childColumns.map(o => {
                                    if (!columnMap.has(o)) {
                                        const col = new ComputedColumnExpression(objectOperandSelect.entity, o, this.newAlias("column") as keyof object);
                                        objectSelectExp.selects.push(col);

                                        const projectedCol = new ColumnExpression(entityExp, col.type, col.propertyName, col.columnName, col.isPrimary, col.isNullable);
                                        projectedCol.columnMeta = col.columnMeta;
                                        entityExp.properties[col.propertyName] = projectedCol;
                                        columnMap.set(o, projectedCol);
                                    }

                                    const projectedCol = columnMap.get(o);
                                    return entityExp.properties[projectedCol.propertyName];
                                }));
                                selectExp.addInclude(prop, propExp, relation, "many");
                                continue;
                            }
                            if (isEntityExp(propExp)) {
                                const joinRel = propExp.parentJoin;
                                const propEntityExp = propExp.clone();
                                const selectExp = new SelectExpression(propEntityExp);
                                const relation = createExpression2(joinRel!.relation, joinRel.childColumns, joinRel.childColumns.map(o => {
                                    if (!columnMap.has(o)) {
                                        const col = new ComputedColumnExpression(objectOperandSelect.entity, o, this.newAlias("column") as keyof object);
                                        objectSelectExp.selects.push(col);

                                        const projectedCol = new ColumnExpression(entityExp, col.type, col.propertyName, col.columnName, col.isPrimary, col.isNullable);
                                        projectedCol.columnMeta = col.columnMeta;
                                        entityExp.properties[col.propertyName] = projectedCol;
                                        columnMap.set(o, projectedCol);
                                    }

                                    const projectedCol = columnMap.get(o);
                                    return entityExp.properties[projectedCol.propertyName];
                                }));
                                selectExp.addInclude(prop, selectExp, relation, "one");
                                continue;
                            }
                            if (isColumnExp(propExp)) {
                                if (!objectSelectExp.selects.includes(propExp)) {
                                    objectOperandSelect.selects.push(propExp);
                                }

                                const col = new ComputedColumnExpression(objectOperandSelect.entity, propExp, prop as keyof object);
                                objectSelectExp.selects.push(col);

                                const projectedCol = new ColumnExpression(entityExp, col.type, col.propertyName, col.columnName, col.isPrimary, col.isNullable);
                                projectedCol.columnMeta = col.columnMeta;
                                entityExp.properties[col.propertyName] = projectedCol;
                                selectExp.selects.push(projectedCol);
                                continue;
                            }

                            const col = new ComputedColumnExpression(objectOperandSelect.entity, propExp, prop as keyof object);
                            objectSelectExp.selects.push(col);

                            const projectedCol = new ColumnExpression(entityExp, col.type, col.propertyName, col.columnName, col.isPrimary, col.isNullable);
                            projectedCol.columnMeta = col.columnMeta;
                            entityExp.properties[col.propertyName] = projectedCol;
                            selectExp.selects.push(projectedCol);
                        }

                        return selectExp as unknown as IExpression<T>;
                    }
                    if (isEntityExp<ElementType<T>>(selectorExp)) {
                        const selectExp = new SelectExpression(selectorExp);
                        reverseJoinTill(selectExp, objectSelectExp);
                        return selectExp as unknown as IExpression<T>;
                    }
                    // TODO: group by still not clear
                    if (isSelectExp<ElementType<T>>(selectorExp)) {
                        const joinRel = reverseJoinTill(selectorExp, objectOperandSelect);
                        const keySelectExp = new SelectExpression(selectorExp.entity);
                        keySelectExp.selects = [];
                        const entityExp = new ProjectionEntityExpression(keySelectExp, type);
                        for (const columnExp of joinRel.parentColumns) {
                            if (!keySelectExp.selects.includes(columnExp)) {
                                keySelectExp.selects.push(columnExp);
                            }

                            const projectedCol = new ColumnExpression(entityExp, columnExp.type, columnExp.propertyName, columnExp.columnName, columnExp.isPrimary, columnExp.isNullable);
                            projectedCol.columnMeta = columnExp.columnMeta;
                            entityExp.properties[projectedCol.propertyName] = projectedCol;
                        }

                        joinRel.parentColumns
                        const groupExp = new GroupByExpression(selectorExp, entityExp);
                        if (selectorExp instanceof GroupByExpression) {
                            // TODO:
                            selectOperand.isAggregated = true;
                        }

                        while (selectorExp.parentRelation && selectorExp.parentRelation.parent !== context.selectExpression) {
                            const parentRel = selectorExp.parentRelation as JoinRelation;
                            const nextParent = parentRel.parent.parentRelation as JoinRelation;
                            selectorExp.addJoin(parentRel.parent, parentRel.relation, reverseJoinType(parentRel.type), parentRel.isEmbedded);
                            ArrayExtension.add(selectorExp.selects, ...nextParent.childColumns);
                            selectorExp.parentRelation = nextParent;
                        }

                        const parentRel = selectorExp.parentRelation as JoinRelation;
                        if (!parentRel) {
                            throw "unexpected";
                        }

                        const objExp = new ObjectValueExpression<Record<string, unknown>>({});
                        const paramExp = new ParameterExpression("o", selectorExp.itemType);
                        for (const relCol of parentRel.parentColumns) {
                            objExp.object[relCol.propertyName] = relCol;
                        }
                        const fnExp = new FunctionExpression(objExp, [paramExp]);
                        const groupByMethodExp = new MethodCallExpression(selectorExp, "groupBy" as MethodKey<[]>, [fnExp]);
                        const groupByExp = this.visit(groupByMethodExp, context) as unknown as GroupByExpression<object>;

                        selectorExp.parentRelation = null;
                        parentRel.relation = createExpression2(parentRel.relation, parentRel.childColumns, parentRel.childColumns.map(o => (groupByExp.key as IEntityExpression).properties[o.propertyName as keyof object]));
                        parentRel.child = groupByExp;
                        groupByExp.parentRelation = parentRel;

                        return groupByExp as unknown as IExpression<Extract<T, object>>;
                    }
                    if (isColumnExp(selectorExp)) {
                        objectSelectExp.selects = [selectorExp];
                        const projectedEntityExp = new ProjectionEntityExpression<T>(objectSelectExp, type ?? selectorExp.type);
                        const selectExp = new SelectExpression(projectedEntityExp);

                        selectExp.paramExps.push(...visitContext.selectExpression.paramExps);
                        return selectExp as unknown as IExpression<T>;
                    }

                    const column = new ComputedColumnExpression(objectSelectExp.entity, selectorExp as IExpression<Extract<T, ValueType>>, this.newAlias("column") as keyof object);
                    objectSelectExp.selects = [column];
                    const projectedEntityExp = new ProjectionEntityExpression(objectSelectExp, type ?? selectorExp.type);
                    const selectExp = new SelectExpression(projectedEntityExp);

                    selectExp.paramExps.push(...visitContext.selectExpression.paramExps);
                    return selectExp as unknown as IExpression<T>;
                }
                case "flatMap": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    const selectorFn = exp.params[0] as FunctionExpression<T, [unknown]>;
                    const visitContext: IQueryVisitContext = {
                        selectExpression: objectSelectExp,
                        scope: exp.methodName
                    };

                    const type = (exp.params[1] as ValueExpression<GenericType<ElementType<T>>>)?.value;
                    let selectorExp = this.visitFunction(selectorFn, [objectSelectExp.getItemExpression()], visitContext);
                    if (!isSelectExp<ElementType<T>>(selectorExp)) {
                        throw new Error(`Queryable<${objectOperand.itemType.name}>.flatMap required selector with array or queryable or enumerable return value.`);
                    }

                    let joinRel: JoinRelation = selectorExp.entity.parentJoin;
                    while (joinRel) {
                        selectorExp.joins.push(joinRel.reverse());
                        if (joinRel.parent === objectSelectExp.entity) {
                            break;
                        }
                        joinRel = joinRel.parent.parentJoin;
                    }

                    if (type) {
                        selectorExp.entity.type = type;
                    }
                    selectorExp.paramExps.push(...objectOperandSelect.paramExps);
                    return selectorExp;
                }
                case "withRelated": {
                    const paramExpCount = objectOperand.paramExps.length;
                    for (const paramFn of exp.params) {
                        const selectorFn = paramFn as FunctionExpression<T, [unknown]>;
                        const visitContext: IQueryVisitContext = { selectExpression: objectOperand, scope: exp.methodName };
                        const resultExp = this.visitFunction(selectorFn, [objectOperand.getItemExpression()], visitContext) as SelectExpression<Extract<T, object>> | IEntityExpression<Extract<T, object>>;

                        // move all new parameter to loaded child select
                        const childExp = isSelectExp<Extract<T, object>>(resultExp) ? resultExp : resultExp.select;
                        if (!childExp.paramExps) {
                            childExp.paramExps = [];
                        }

                        const newParamExps = objectOperand.paramExps.splice(paramExpCount, objectOperand.paramExps.length - paramExpCount);
                        childExp.paramExps.push(...newParamExps);
                    }
                    return objectOperand as IExpression<Extract<T, TE>>;
                }
                case "filter": {
                    if (objectSelectExp.paging.skip) {
                        objectSelectExp = createProjectionSelect(objectSelectExp);
                    }

                    if (context.scope === "select-object" && objectSelectExp instanceof GroupedExpression) {
                        const objectGroupSelectExp = objectSelectExp as GroupedExpression<Extract<ElementType<TE>, object>>;
                        const entityExp = objectGroupSelectExp.entity.clone();
                        entityExp.alias = this.newAlias();
                        const selectExp = new SelectExpression(entityExp);
                        const relation = new AndExpression();
                        for (const parentCol of objectGroupSelectExp.entity.primaryColumns) {
                            const childCol = entityExp.properties[parentCol.propertyName];
                            const logicalExp = new StrictEqualExpression(parentCol, childCol);
                            relation.operands.push(logicalExp);
                        }
                        objectSelectExp.addJoin(selectExp, relation.asOperand(), "LEFT");
                        objectSelectExp = selectExp;
                    }

                    const predicateFn = exp.params[0] as FunctionExpression<boolean, [unknown]>;
                    const visitContext: IQueryVisitContext = {
                        selectExpression: objectSelectExp,
                        scope: "filter"
                    };
                    const whereExp = this.visitFunction(predicateFn, [objectSelectExp.getItemExpression()], visitContext);

                    if (whereExp.type !== Boolean) {
                        throw new Error(`Queryable<${objectSelectExp.itemType.name}>.where required predicate with boolean return value.`);
                    }

                    objectSelectExp.addWhere(whereExp);
                    return objectSelectExp as unknown as IExpression<T>;
                }
                case "includes": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    let item = exp.params[0] as IExpression<Extract<ElementType<TE>, object>>;
                    let andExp: IExpression<boolean>;
                    const isSubSelect = objectSelectExp.isSubSelect;
                    if (isSubSelect) {
                        item = this.visit(item, context);
                        objectSelectExp.isAggregated = true;
                        ArrayExtension.delete(objectSelectExp.parentRelation.parent.joins, objectSelectExp.parentRelation as JoinRelation);
                        objectSelectExp.parentRelation = null;
                        return new MethodCallExpression(objectSelectExp, "includes", [item]);
                    }
                    else if (isValueType(objectOperandSelect.entity.type)) {
                        andExp = new EqualExpression(objectSelectExp.selects[0], item);
                    }
                    else {
                        const pkFilter = new AndExpression();
                        for (const primaryCol of objectSelectExp.entity.primaryColumns) {
                            const d = new EqualExpression(primaryCol, new MemberAccessExpression(item, primaryCol.propertyName));
                            pkFilter.operands.push(d);
                        }
                        andExp = pkFilter.asOperand();
                    }

                    if (context.scope === "queryable") {
                        objectSelectExp.addWhere(andExp);
                        const column = new ComputedColumnExpression(objectSelectExp.entity, new ValueExpression(true), this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        objectSelectExp.selects = [column];
                        objectSelectExp.paging.take = new ValueExpression(1);
                        objectSelectExp.isAggregated = true;
                        return objectSelectExp as unknown as IExpression<T>;
                    }

                    return andExp as IExpression<T>;
                }
                case "distinct": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    if (objectSelectExp.paging.skip) {
                        objectSelectExp = createProjectionSelect(objectSelectExp);
                    }

                    objectSelectExp.distinct = true;
                    return objectSelectExp as unknown as IExpression<T>;
                }
                case "orderBy": {
                    if (objectSelectExp.paging.skip) {
                        objectSelectExp = createProjectionSelect(objectSelectExp);
                    }

                    const orders: IOrderExpression[] = [];
                    for (const selector of exp.params as ArrayValueExpression[]) {
                        const selectorFn = selector.items[0] as FunctionExpression<unknown, [unknown]>;
                        const direction = selector.items[1] ? selector.items[1] as ValueExpression<OrderDirection> : new ValueExpression<OrderDirection>("ASC");
                        const visitContext: IQueryVisitContext = { selectExpression: objectSelectExp, scope: exp.methodName };
                        const selectExp = this.visitFunction(selectorFn, [objectSelectExp.getItemExpression()], visitContext) as IColumnExpression;

                        if (!isValueType(selectExp.type)) {
                            throw new Error(`Queryable<${objectOperand.itemType.name}>.orderBy required select with basic type return value.`);
                        }
                        orders.push({
                            column: selectExp,
                            direction: direction.value
                        });
                    }

                    if (orders.length > 0) {
                        objectOperand.setOrder(orders);
                    }
                    return objectOperand as unknown as IExpression<T>;
                }
                case "count": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    const countExp = new MethodCallExpression<TE, K, Extract<number, T>>(objectSelectExp, exp.methodName, [objectSelectExp.entity], Number);
                    const parentRel = objectSelectExp.parentRelation as JoinRelation<object, Extract<ElementType<TE>, object>>;
                    if (context.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(objectSelectExp.entity, countExp, this.newAlias("column") as StringKeyOf<Extract<ElementType<TE>, object>>);
                        objectSelectExp.selects = [column];
                        objectSelectExp.itemExpression = column;
                        objectSelectExp.isAggregated = true;
                        return objectSelectExp as IExpression<Extract<T, TE>>;
                    }
                    else if (selectOperand instanceof GroupedExpression || (parentRel?.parent instanceof GroupByExpression)) {
                        // don't select unnecessary column
                        if (context.scope && context.scope.indexOf("map") === 0) {
                            selectOperand.selects = [];
                        }
                        return countExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const objExp = new ObjectValueExpression<Record<string, unknown>>({});
                        if (parentRel) {
                            for (const relCol of parentRel.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }
                        const groupExp = new GroupByExpression(selectOperand, objExp);
                        groupExp.isAggregated = true;
                        const column = new ComputedColumnExpression(groupExp.entity, countExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (parentRel?.isManyToManyRelation) {
                            // alter relation to: parent -> bridge -> groupExp
                            const parentSelect = parentRel.parent;
                            ArrayExtension.delete(parentSelect.joins, parentRel);

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
                            const bridgeAggreateExp = new MethodCallExpression(bridge, "sum" as MethodKey<[]>, [column], Number as unknown as GenericType<number & T>);
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column") as StringKeyOf<object>);
                            bridgeColumn.isNullable = false;

                            const groupKey = new ObjectValueExpression<Record<string, unknown>>({});
                            // add join from parent to bridge
                            const bridgeParentRelation = new AndExpression();
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = parentSelect.projectedColumns.find((o) => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation.operands.push(logicalExp);
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregated = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation.asOperand(), "LEFT");
                            ArrayExtension.add(groupedBridge.selects, bridgeColumn);

                            return bridgeColumn;
                        }

                        return new NullCoalesceExpression(column, new ValueExpression(0 as Extract<Number, T>));
                    }
                }
                case "sum":
                case "avg": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    let selectExp = objectSelectExp as unknown as SelectExpression<Extract<ElementType<TE>, object>, Extract<T, number>>;
                    if (exp.params.length > 0) {
                        const selectorFn = exp.params[0] as FunctionExpression<number, [unknown]>;
                        const visitContext: IQueryVisitContext = { selectExpression: selectExp, scope: context.scope };
                        const selectExpression = this.visit(new MethodCallExpression(selectExp, "map", [selectorFn]), visitContext) as SelectExpression<Extract<ElementType<TE>, object>, Extract<T, number>>;
                        context.selectExpression = visitContext.selectExpression;

                        if (!isValueType(selectExpression.itemType)) {
                            throw new Error(`Queryable<${selectOperand.type.name}> required select with basic type return value.`);
                        }

                        selectExp = selectExpression;
                    }
                    const aggregateExp = new MethodCallExpression(selectExp as unknown as IExpression<TE>, exp.methodName, selectExp.selects.slice(0, 1).map((o) => {
                        if (o instanceof ComputedColumnExpression) {
                            return o.expression;
                        }
                        return o;
                    }), Number as unknown as GenericType<Extract<T, number>>);
                    const parentRel = selectExp.parentRelation as JoinRelation;
                    if (context.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(selectExp.entity, aggregateExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        selectExp.selects = [column];
                        selectExp.isAggregated = true;
                        return selectExp as unknown as IExpression<T>;
                    }
                    else if (selectOperand instanceof GroupByExpression || (parentRel && parentRel.parent instanceof GroupByExpression)) {
                        return aggregateExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const objExp = new ObjectValueExpression<Record<string, unknown>>({});
                        if (parentRel) {
                            for (const relCol of parentRel.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }
                        const groupExp = new GroupByExpression(selectExp, objExp);
                        groupExp.isAggregated = true;
                        const column = new ComputedColumnExpression(groupExp.entity, aggregateExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (parentRel && parentRel.isManyToManyRelation) {
                            // alter relation to: parent -> bridge -> groupExp
                            const parentSelect = parentRel.parent;
                            ArrayExtension.delete(parentSelect.joins, parentRel);

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
                            const bridgeAggreateExp = new MethodCallExpression(bridge as unknown as IExpression<TE>, exp.methodName, [column], Number as unknown as GenericType<number & T>);
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            bridgeColumn.isNullable = false;

                            const groupKey = new ObjectValueExpression<Record<string, unknown>>({});
                            // add join from parent to bridge
                            const bridgeParentRelation = new AndExpression();
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = parentSelect.projectedColumns.find((o) => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation.operands.push(logicalExp);
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregated = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation.asOperand(), "LEFT");
                            ArrayExtension.add(groupedBridge.selects, bridgeColumn);

                            return bridgeColumn;
                        }

                        return new NullCoalesceExpression(column, new ValueExpression(0 as Extract<T, number>));
                    }
                }
                case "max":
                case "min": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    if (exp.params.length > 0) {
                        const selectorFn = exp.params[0] as FunctionExpression;
                        const visitContext: IQueryVisitContext = { selectExpression: selectOperand, scope: context.scope };
                        const selectExpression = this.visit(new MethodCallExpression(objectOperand, "map", [selectorFn]), visitContext) as SelectExpression;
                        context.selectExpression = visitContext.selectExpression;

                        if (!isValueType(selectExpression.itemType)) {
                            throw new Error(`Queryable<${selectOperand.type.name}> required select with basic type return value.`);
                        }

                        selectOperand = selectExpression;
                    }
                    const aggregateExp = new MethodCallExpression(selectOperand as unknown as IExpression<TE>, exp.methodName, selectOperand.selects.map((o) => {
                        if (o instanceof ComputedColumnExpression) {
                            return o.expression;
                        }
                        return o;
                    }), selectOperand.itemType as GenericType<Extract<T, ValueType>>);
                    const parentRel = selectOperand.parentRelation as JoinRelation;
                    if (context.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(selectOperand.entity, aggregateExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        objectOperand.selects = [column];
                        objectOperand.isAggregated = true;
                        return objectOperand as unknown as IExpression<T>;
                    }
                    else if (selectOperand instanceof GroupByExpression || (parentRel && parentRel.parent instanceof GroupByExpression)) {
                        return aggregateExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const objExp = new ObjectValueExpression<Record<string, unknown>>({});
                        if (parentRel) {
                            for (const relCol of parentRel.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }
                        const groupExp = new GroupByExpression(selectOperand, objExp);
                        groupExp.isAggregated = true;
                        const column = new ComputedColumnExpression(groupExp.entity, aggregateExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (parentRel && parentRel.isManyToManyRelation) {
                            // alter relation to: parent -> bridge -> groupExp
                            const parentSelect = parentRel.parent;
                            ArrayExtension.delete(parentSelect.joins, parentRel);

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
                            const bridgeAggreateExp = new MethodCallExpression(bridge as unknown as IExpression<TE>, exp.methodName, [column], Number as unknown as GenericType<number & T>);
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            bridgeColumn.isNullable = false;

                            const groupKey = new ObjectValueExpression<Record<string, unknown>>({});
                            // add join from parent to bridge
                            const bridgeParentRelation = new AndExpression();
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = parentSelect.projectedColumns.find((o) => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation.operands.push(logicalExp);
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregated = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation.asOperand(), "LEFT");
                            ArrayExtension.add(groupedBridge.selects, bridgeColumn);

                            return bridgeColumn;
                        }

                        return column;
                    }
                }
                case "join": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    let columnExp = Enumerable.from(selectOperand.selects).slice(0, 1).map((o) => {
                        if (o instanceof ComputedColumnExpression) {
                            return o.expression;
                        }
                        return o;
                    }).find();

                    const aggregateExp = new MethodCallExpression(selectOperand as unknown as IExpression<TE>, exp.methodName, [columnExp, exp.params[0]], String as unknown as GenericType<string & T>);
                    const parentRel = selectOperand.parentRelation as JoinRelation;
                    if (context.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(selectOperand.entity, aggregateExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        objectOperand.selects = [column];
                        objectOperand.isAggregated = true;
                        return objectOperand as unknown as IExpression<T>;
                    }
                    else if (selectOperand instanceof GroupByExpression || (parentRel && parentRel.parent instanceof GroupByExpression)) {
                        return aggregateExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const objExp = new ObjectValueExpression<Record<string, unknown>>({});
                        if (parentRel) {
                            for (const relCol of parentRel.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }

                        const groupExp = new GroupByExpression(selectOperand, objExp);
                        groupExp.isAggregated = true;
                        const column = new ComputedColumnExpression(groupExp.entity, aggregateExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (parentRel && parentRel.isManyToManyRelation) {
                            // alter relation to: parent -> bridge -> groupExp
                            const parentSelect = parentRel.parent;
                            ArrayExtension.delete(parentSelect.joins, parentRel);

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
                            const bridgeAggreateExp = new MethodCallExpression(bridge as unknown as IExpression<TE>, exp.methodName, [column], String as unknown as GenericType<string & T>);
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            bridgeColumn.isNullable = false;

                            const groupKey = new ObjectValueExpression<Record<string, unknown>>({});
                            // add join from parent to bridge
                            const bridgeParentRelation = new AndExpression();
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = parentSelect.projectedColumns.find((o) => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation.operands.push(logicalExp);
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregated = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation.asOperand(), "LEFT");
                            ArrayExtension.add(groupedBridge.selects, bridgeColumn);

                            return bridgeColumn;
                        }

                        return column;
                    }
                }
                case "every":
                case "some": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    const isAny = exp.methodName === "some";
                    if (!isAny && exp.params.length <= 0) {
                        throw new QueryBuilderError(QueryBuilderErrorCode.UsageIssue, "All required 1 parameter");
                    }

                    if (exp.params.length > 0) {
                        const predicateFn = exp.params[0] as FunctionExpression;
                        if (!isAny) {
                            predicateFn.body = new NotExpression(predicateFn.body);
                        }
                        const visitContext: IQueryVisitContext = { selectExpression: selectOperand, scope: context.scope };
                        this.visit(new MethodCallExpression(selectOperand, "filter", [predicateFn]), visitContext);
                    }

                    const anyExp = new ValueExpression(isAny as boolean & T);
                    const parentRel = selectOperand.parentRelation as JoinRelation;
                    if (context.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(objectOperand.entity, anyExp, this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.paging.take = new ValueExpression(1);
                        objectOperand.isAggregated = true;
                        return objectOperand as unknown as IExpression<T>;
                    }
                    else if (selectOperand instanceof GroupedExpression || (parentRel && parentRel.parent instanceof GroupByExpression)) {
                        // don't select unnecessary column
                        if (context.scope && context.scope.indexOf("map") === 0) {
                            selectOperand.selects = [];
                        }
                        return anyExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const objExp = new ObjectValueExpression<Record<string, unknown>>({});
                        if (parentRel) {
                            for (const relCol of parentRel.childColumns) {
                                objExp.object[relCol.propertyName] = relCol;
                            }
                        }
                        const groupExp = new GroupByExpression(selectOperand, objExp);
                        groupExp.isAggregated = true;
                        const column = new ComputedColumnExpression(groupExp.entity, anyExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        column.isNullable = false;
                        groupExp.selects.push(column);

                        if (parentRel && parentRel.isManyToManyRelation) {
                            // alter relation to: parent -> bridge -> groupExp
                            const parentSelect = parentRel.parent;
                            ArrayExtension.delete(parentSelect.joins, parentRel);

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
                                bridgeAggreateExp = new StrictNotEqualExpression(new MethodCallExpression(bridge, "max" as MethodKey<[]>, [column], Boolean), new ValueExpression(null));
                            }
                            else {
                                bridgeAggreateExp = new StrictEqualExpression(new MethodCallExpression(bridge, "max" as MethodKey<[]>, [column], Boolean), new ValueExpression(null));
                            }
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            bridgeColumn.isNullable = false;

                            const groupKey = new ObjectValueExpression<Record<string, unknown>>({});
                            // add join from parent to bridge
                            const bridgeParentRelation = new AndExpression();
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = parentSelect.projectedColumns.find((o) => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation.operands.push(logicalExp);
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregated = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation.asOperand(), "LEFT");
                            ArrayExtension.add(groupedBridge.selects, bridgeColumn);

                            return new StrictEqualExpression(bridgeColumn, new ValueExpression(true)) as unknown as IExpression<boolean & T>;
                        }

                        const parentCol = new ColumnExpression(column.entity, column.type, column.propertyName, column.columnName, column.isPrimary, column.isNullable);
                        if (isAny) {
                            return new StrictNotEqualExpression(parentCol, new ValueExpression(null)) as unknown as IExpression<boolean & T>;
                        }

                        return new StrictEqualExpression(parentCol, new ValueExpression(null)) as unknown as IExpression<boolean & T>;
                    }
                }
                case "find": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    if (exp.params.length > 0) {
                        const predicateFn = exp.params[0] as FunctionExpression;
                        const visitContext: IQueryVisitContext = { selectExpression: selectOperand, scope: exp.methodName };
                        this.visit(new MethodCallExpression(selectOperand, "filter", [predicateFn]), visitContext);
                        context.selectExpression = visitContext.selectExpression;
                    }

                    if (context.scope === "queryable") {
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

                        const joinExp = new AndExpression();
                        for (const relCol of relationColumns) {
                            const sortCol = sorter.entity.properties[relCol.propertyName];
                            const filterCol = filterer.entity.properties[relCol.propertyName];
                            const logicalExp = new StrictEqualExpression(sortCol, filterCol);
                            joinExp.operands.push(logicalExp);
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
                        joinExp.operands.push(orderExp);
                        filterer.addJoin(sorter, joinExp, "INNER");

                        const countExp = new MethodCallExpression(filterer, "count" as MethodKey<[]>, [filterer.entity], Number);
                        const colCountExp = new ComputedColumnExpression(filterer.entity, countExp, this.newAlias("column"));

                        let keyExp: IExpression;
                        if (filterer.entity.primaryColumns.length > 1) {
                            const objExp = new ObjectValueExpression<Record<string, unknown>>({});
                            for (const o of filterer.entity.primaryColumns) {
                                objExp.object[o.propertyName] = o;
                            }
                            keyExp = objExp;
                        }
                        else {
                            keyExp = filterer.entity.primaryColumns.find(() => true);
                        }
                        const groupExp = new GroupByExpression(filterer, keyExp);
                        groupExp.isAggregated = true;
                        groupExp.selects = [colCountExp];

                        // add join relation to current object operand
                        const joinRelation = new AndExpression();
                        for (let i = 0, len = entityExp.primaryColumns.length; i < len; i++) {
                            const objCol = entityExp.primaryColumns[i];
                            const groupCol = groupExp.entity.primaryColumns[i];
                            const logicalExp = new StrictEqualExpression(objCol, groupCol);
                            joinRelation.operands.push(logicalExp);
                        }

                        objectOperand.addJoin(groupExp, joinRelation.asOperand(), "INNER");
                        groupExp.having = new LessEqualExpression(countExp, new ValueExpression(1));
                    }
                    return selectOperand.entity as unknown as IExpression<T>;
                }
                case "slice": {
                    let startExp = exp.params[0] as ParameterExpression<number>;
                    let endExp: ParameterExpression<number>;
                    if (exp.params.length > 1) {
                        endExp = exp.params.length > 1 ? exp.params[1] as ParameterExpression<number> : undefined;
                    }

                    if (context.scope === "queryable") {
                        if (objectOperand instanceof GroupByExpression && !objectOperand.isAggregated) {
                            // join to select that will page result by group instead of item.
                            const selectExp = objectOperand.itemSelect.clone();
                            selectExp.entity.alias = this.newAlias();
                            selectExp.selects = selectExp.groupBy.slice();
                            selectExp.includes = [];
                            selectExp.isAggregated = true;
                            selectOperand = selectExp;

                            const relation = new AndExpression();
                            for (let i = 0, len = objectOperand.groupBy.length; i < len; i++) {
                                const parentCol = objectOperand.groupBy[i];
                                const childCol = selectExp.groupBy[i];
                                const logicalExp = new StrictEqualExpression(parentCol, childCol);
                                relation.operands.push(logicalExp);
                            }

                            objectOperand.addJoin(selectExp, relation.asOperand(), "INNER");
                        }

                        if (selectOperand.paging.take) {
                            selectOperand.paging.take = this.visit<number>(new SubstractionExpression(selectOperand.paging.take, startExp), context);
                        }
                        selectOperand.paging.skip = this.visit(selectOperand.paging.skip ? new AdditionExpression(selectOperand.paging.skip, startExp) : startExp, context);

                        if (endExp) {
                            selectOperand.paging.take = this.visit(selectOperand.paging.take ? new MethodCallExpression(new ValueExpression(Math), "min", [selectOperand.paging.take, endExp]) : endExp, context);
                        }
                    }
                    else {
                        let pagingJoinRel = Enumerable.from(objectOperand.joins).ofType(PagingJoinRelation).find();
                        if (!pagingJoinRel) {
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

                            const joinExp = new AndExpression();
                            for (const relCol of relationColumns) {
                                const sortCol = sorter.entity.properties[relCol.propertyName];
                                const filterCol = filterer.entity.properties[relCol.propertyName];
                                const logicalExp = new StrictEqualExpression(sortCol, filterCol);
                                joinExp.operands.push(logicalExp);
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
                            joinExp.operands.push(orderExp);
                            filterer.addJoin(sorter, joinExp, "INNER");

                            const innercountExp = new MethodCallExpression(filterer, "count" as MethodKey<[]>, [filterer.entity], Number);
                            const colCountExp = new ComputedColumnExpression(filterer.entity, innercountExp, this.newAlias("column"));

                            let keyExp: IExpression;
                            if (filterer.entity.primaryColumns.length > 1) {
                                const objExp = new ObjectValueExpression<Record<string, unknown>>({});
                                for (const o of filterer.entity.primaryColumns) {
                                    objExp.object[o.propertyName] = o;
                                }
                                keyExp = objExp;
                            }
                            else {
                                keyExp = filterer.entity.primaryColumns.find(() => true);
                            }
                            const innerGroupExp = new GroupByExpression(filterer, keyExp);
                            innerGroupExp.isAggregated = true;
                            innerGroupExp.selects.push(colCountExp);

                            // add join relation to current object operand
                            const joinRelation = new AndExpression();
                            for (let i = 0, len = entityExp.primaryColumns.length; i < len; i++) {
                                const objCol = entityExp.primaryColumns[i];
                                const groupCol = innerGroupExp.entity.primaryColumns[i];
                                const logicalExp = new StrictEqualExpression(objCol, groupCol);
                                joinRelation.operands.push(logicalExp);
                            }

                            pagingJoinRel = new PagingJoinRelation(objectOperand, innerGroupExp, joinRelation.asOperand(), "INNER");
                            objectOperand.joins.push(pagingJoinRel);
                            innerGroupExp.parentRelation = pagingJoinRel;
                        }

                        const groupExp = pagingJoinRel.child as GroupByExpression;
                        const countExp = (Enumerable.from(groupExp.selects).except(groupExp.groupBy).find() as ComputedColumnExpression).expression;

                        const pagingStartExp = pagingJoinRel.start ? new AdditionExpression(pagingJoinRel.start, startExp) : startExp;
                        pagingJoinRel.start = this.visit(pagingStartExp, context);
                        if (endExp) {
                            pagingJoinRel.end = this.visit(pagingStartExp ? new AdditionExpression(pagingStartExp, endExp) : endExp, context);
                        }

                        groupExp.having = null;
                        if (pagingJoinRel.start) {
                            groupExp.having = new GreaterThanExpression(countExp, pagingJoinRel.start);
                        }
                        if (pagingJoinRel.end) {
                            const takeLogicalExp = new LessEqualExpression(countExp, pagingJoinRel.end);
                            groupExp.having = groupExp.having ? new AndExpression(groupExp.having, takeLogicalExp) : takeLogicalExp;
                        }
                    }

                    return objectOperand as unknown as IExpression<T>;
                }
                case "union":
                case "intersect":
                case "except":
                case "concat": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    const visitContext: IQueryVisitContext = { selectExpression: context.selectExpression, scope: exp.methodName };
                    if (context.scope === "select-object" && visitContext.selectExpression.parentRelation) {
                        visitContext.selectExpression = visitContext.selectExpression.parentRelation.parent;
                    }
                    const childSelectOperands: [SelectExpression<ElementType<TE> & object>, ...SelectExpression<ElementType<TE> & object>[]] = exp.params.map(px => {
                        const childOp = this.visit(px, { ...visitContext }) as SelectExpression<ElementType<TE> & object>;
                        if (childOp.parentRelation) {
                            ArrayExtension.add(childOp.selects, ...childOp.parentRelation.childColumns);
                            switch (true) {
                                case childOp.parentRelation instanceof JoinRelation: {
                                    ArrayExtension.delete(childOp.parentRelation.parent.joins, childOp.parentRelation);
                                    break;
                                }
                                case childOp.parentRelation instanceof IncludeRelation: {
                                    ArrayExtension.delete(childOp.parentRelation.parent.includes, childOp.parentRelation);
                                    break;
                                }
                            }
                            childOp.parentRelation = null;
                        }

                        return childOp;
                    }) as [SelectExpression<ElementType<TE> & object>, ...SelectExpression<ElementType<TE> & object>[]];
                    context.selectExpression = visitContext.selectExpression;

                    const parentRelation = objectOperand.parentRelation;
                    if (selectOperand.parentRelation) {
                        ArrayExtension.add(selectOperand.selects, ...selectOperand.parentRelation.childColumns);
                        selectOperand.parentRelation = null;
                    }
                    let entityExp: UnionExpression<ElementType<TE> & object>;
                    switch (exp.methodName) {
                        case "concat":
                            entityExp = new ConcatExpression<ElementType<TE> & object>(undefined as GenericType<ElementType<TE> & object>, selectOperand, ...childSelectOperands);
                            break;
                        case "union":
                            entityExp = new UnionExpression<ElementType<TE> & object>(undefined as GenericType<ElementType<TE> & object>, selectOperand, ...childSelectOperands);
                            break;
                        case "intersect":
                            entityExp = new IntersectExpression<ElementType<TE> & object>(undefined as GenericType<ElementType<TE> & object>, selectOperand, ...childSelectOperands);
                            break;
                        case "except":
                            entityExp = new ExceptExpression<ElementType<TE> & object>(undefined as GenericType<ElementType<TE> & object>, selectOperand, ...childSelectOperands);
                            break;
                    }
                    selectOperand = new SelectExpression(entityExp);
                    selectOperand.selects = entityExp.selectedColumns.slice(0);

                    if (parentRelation) {
                        const replaceMap = new Map();
                        for (const col of parentRelation.parentColumns) {
                            replaceMap.set(col, col);
                        }
                        for (const oriCol of parentRelation.childColumns) {
                            const col = entityExp.properties[oriCol.propertyName as keyof object];
                            replaceMap.set(oriCol, col);
                        }
                        parentRelation.relation = resolveClone(parentRelation.relation, replaceMap);
                        parentRelation.child = selectOperand;
                        selectOperand.parentRelation = parentRelation;
                    }
                    else {
                        context.selectExpression = selectOperand;
                    }
                    return selectOperand as unknown as IExpression<T>;
                }
                case "innerJoin":
                case "leftJoin":
                case "rightJoin":
                case "fullJoin":
                case "groupJoin": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    const parentRelation = objectOperand.parentRelation;
                    const visitContext: IQueryVisitContext = { selectExpression: selectOperand, scope: "join" };
                    const childSelectOperand = this.visit(exp.params[0], visitContext) as SelectExpression;

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

                    const relationSelector = exp.params[1] as FunctionExpression<boolean, [unknown, unknown]>;
                    const relation = this.visitFunction(relationSelector, [selectOperand.getItemExpression(), childSelectOperand.getItemExpression()], visitContext);

                    if (exp.methodName === "groupJoin") {
                        childSelectOperand.parentRelation = new JoinRelation(selectOperand, childSelectOperand, relation, jointType);
                    }
                    else {
                        selectOperand.addJoin(childSelectOperand, relation, jointType);
                    }

                    const resultVisitContext: IQueryVisitContext = { selectExpression: selectOperand, scope: "join" };
                    const resultSelector = exp.params[2] as FunctionExpression<unknown, [unknown, unknown]>;
                    const paramExp = resultSelector.params.pop();
                    this.scopeParameters.add(paramExp.name, exp.methodName === "groupJoin" ? childSelectOperand : childSelectOperand.getItemExpression());
                    this.visit(new MethodCallExpression(selectOperand, "map", [resultSelector]), resultVisitContext);
                    this.scopeParameters.remove(paramExp.name);
                    if (parentRelation) {
                        parentRelation.child = selectOperand;
                        selectOperand.parentRelation = parentRelation;
                    }
                    else {
                        context.selectExpression = selectOperand;
                    }

                    return selectOperand as unknown as IExpression<T>;
                }
                case "crossJoin": {
                    if (context.scope === "withRelated") {
                        throw new Error(`${context.scope} did not support ${exp.methodName}`);
                    }

                    const parentRelation = objectOperand.parentRelation;
                    const visitContext: IQueryVisitContext = { selectExpression: selectOperand, scope: "join" };
                    const childSelectOperand = this.visit(exp.params[0], visitContext) as SelectExpression;
                    selectOperand.addJoin(childSelectOperand, null, "CROSS");

                    const resultVisitContext: IQueryVisitContext = { selectExpression: selectOperand, scope: "join" };
                    const resultSelector = exp.params[1] as FunctionExpression<unknown, [unknown, unknown]>;
                    const paramExp = resultSelector.params.pop();
                    this.scopeParameters.add(paramExp.name, childSelectOperand.getItemExpression());
                    this.visit(new MethodCallExpression(selectOperand, "map", [resultSelector]), resultVisitContext);
                    this.scopeParameters.remove(paramExp.name);
                    if (parentRelation) {
                        parentRelation.child = selectOperand;
                        selectOperand.parentRelation = parentRelation;
                    }
                    else {
                        context.selectExpression = selectOperand;
                    }

                    return selectOperand as unknown as IExpression<T>;
                }
                case "toArray": {
                    return objectOperand as IExpression<Extract<T, TE>>;
                }
            }

            throw new Error(`${exp.methodName} not supported on expression`);
        }
        else {
            let params = exp.params.map((o) => this.visit(o, { selectExpression: context.selectExpression }));
            if (objectOperand instanceof ValueExpression) {
                const value = objectOperand.value;
                if (value === Enumerable) {
                    switch (exp.methodName) {
                        case "from": {
                            return params[0] as IExpression<T>;
                        }
                    }
                }
            }

            const isObjectOperandSafe = this.isSafe(objectOperand);
            const isExpressionSafe = isObjectOperandSafe && params.every((o) => this.isSafe(o));

            let objectOperandValue: TE;
            if (isObjectOperandSafe) {
                if (objectOperand instanceof SqlParameterExpression) {
                    objectOperandValue = this.valueTransformer.execute(objectOperand.valueExp);
                }
                else if (objectOperand instanceof ValueExpression) {
                    objectOperandValue = objectOperand.value;
                }
            }

            let visitedExp = new MethodCallExpression<TE, K, T>(objectOperand, exp.methodName, params);
            let translator: IQueryTranslatorItem;
            if (isNotNull(objectOperandValue)) {
                translator = this.translator.resolve(objectOperandValue, exp.methodName);
            }
            if (!translator && objectOperand.type) {
                translator = this.translator.resolve(objectOperand.type.prototype, exp.methodName);
            }
            if (translator && (!isExpressionSafe || translator.isTranslate(visitedExp))) {
                return visitedExp;
            }

            // Execute in app if all parameter is available.
            if (isExpressionSafe) {
                let hasParam = false;
                if (objectOperand instanceof SqlParameterExpression) {
                    ArrayExtension.deleteLast(context.selectExpression.paramExps, objectOperand);
                    visitedExp.objectOperand = objectOperand.valueExp;
                    hasParam = true;
                }
                visitedExp.params = params.map((o) => {
                    if (o instanceof SqlParameterExpression) {
                        ArrayExtension.deleteLast(context.selectExpression.paramExps, o);
                        hasParam = true;
                        return o.valueExp;
                    }

                    return o;
                });

                if (hasParam) {
                    return context.selectExpression.addSqlParameter(visitedExp);
                }

                return new ValueExpression(this.valueTransformer.execute(visitedExp));
            }

            const methodFn: (...args: unknown[]) => unknown = objectOperandValue ? objectOperandValue[exp.methodName] : objectOperand.type.prototype[exp.methodName];
            if (methodFn && !isNativeFunction(methodFn)) {
                // try convert user defined method to a FunctionExpression and built it as a query.
                const methodExp = ExpressionBuilder.parse(methodFn);
                methodExp.params.unshift(new ParameterExpression("this", objectOperand.type));
                const nparams = [objectOperand as IExpression, ...params];
                return this.visitFunction(methodExp, nparams, { selectExpression: context.selectExpression }) as IExpression<T>;
            }
        }

        throw new Error(`${exp.methodName} not supported.`);
    }
    protected visitObjectLiteral<T extends object>(expression: ObjectValueExpression<T>, context: IQueryVisitContext): IExpression<T> {
        const setterObj: SetterObj<T> = {};
        for (const prop in expression.object) {
            const visitContext: IQueryVisitContext = {
                selectExpression: context.selectExpression,
                scope: "select-object" // TODO: REMOVE LATER
            };
            setterObj[prop] = this.visit(expression.object[prop], visitContext);
        }

        return new ObjectValueExpression(setterObj, expression.type);
    }
    protected visitObjectLiteral_CAMPUR<TE extends object>(expression: ObjectValueExpression<TE>, context: IQueryVisitContext): IEntityExpression<TE> {
        const setterObj: SetterObj<TE> = {};
        for (const prop in expression.object) {
            const visitContext: IQueryVisitContext = {
                selectExpression: context.selectExpression,
                scope: "select-object" // TODO: REMOVE LATER
            };
            setterObj[prop] = this.visit(expression.object[prop], visitContext);
        }

        const subSelectExp = createExpression(context.selectExpression, context.selectExpression.entity);
        subSelectExp.selects = subSelectExp.entity.primaryColumns.slice();
        const entityExp = new ProjectionEntityExpression(subSelectExp, Object);
        entityExp.alias = this.newAlias();
        const selectExp = new SelectExpression(entityExp);
        for (const prop in setterObj) {
            const valExp = setterObj[prop];
            if (valExp instanceof SelectExpression) {
                if (valExp instanceof GroupedExpression && valExp.groupByExp === context.selectExpression) {
                    const childSelectExp = valExp.groupByExp.clone();
                    const childEntity = childSelectExp.entity;
                    childEntity.alias = this.newAlias();

                    const replaceMap1 = new Map();
                    mapReplaceExp(replaceMap1, selectExp.entity, childEntity);
                    const relation = new AndExpression();
                    for (const pCol of valExp.groupByExp.primaryKeys) {
                        const childCol = childSelectExp.primaryKeys.find((o) => o.propertyName === pCol.propertyName);
                        const logicalExp = new StrictEqualExpression(pCol, childCol);
                        relation.operands.push(logicalExp);
                    }
                    selectExp.addInclude(prop, childSelectExp, relation.asOperand(), "one");
                }
                else {
                    const joinRel = valExp.parentRelation as JoinRelation;
                    const replaceMap = new Map();
                    for (const pCol of joinRel.parentColumns) {
                        if (pCol.entity === entityExp.subSelect.entity) {
                            replaceMap.set(pCol, entityExp.properties[pCol.propertyName]);
                        }
                        else {
                            const columnExp = new ComputedColumnExpression(selectExp.entity, pCol, this.newAlias("column"));
                            entityExp.properties[columnExp.propertyName] = columnExp;
                            ArrayExtension.add(entityExp.subSelect.selects, pCol);
                            replaceMap.set(pCol, columnExp);
                        }
                    }
                    ArrayExtension.delete(joinRel.parent.joins, joinRel);
                    selectExp.addInclude(prop, valExp, joinRel.relation.clone(replaceMap), "many");
                }
            }
            else if (isEntityExp(valExp)) {
                if (valExp instanceof ProjectionEntityExpression && valExp.subSelect.entity === context.selectExpression.entity) {
                    valExp.alias = this.newAlias();
                    const relation = new AndExpression();
                    for (const pCol of valExp.primaryColumns) {
                        const childCol = entityExp.properties[pCol.propertyName as keyof object];
                        const logicalExp = new StrictEqualExpression(pCol, childCol);
                        relation.operands.push(logicalExp);
                    }
                    selectExp.addInclude(prop, valExp.select, relation.asOperand(), "one");
                }
                else {
                    const joinRel = valExp.select.parentRelation as JoinRelation;
                    const replaceMap = new Map();
                    for (const pCol of joinRel.parentColumns) {
                        if (pCol.entity === entityExp.subSelect.entity) {
                            replaceMap.set(pCol, entityExp.properties[pCol.propertyName]);
                        }
                        else {
                            const columnExp = new ComputedColumnExpression(selectExp.entity, pCol, this.newAlias("column"));
                            entityExp.properties[columnExp.propertyName] = columnExp;
                            ArrayExtension.add(entityExp.subSelect.selects, pCol);
                            replaceMap.set(pCol, columnExp);
                        }
                    }
                    ArrayExtension.delete(joinRel.parent.joins, joinRel);
                    selectExp.addInclude(prop, valExp.select, joinRel.relation.clone(replaceMap), "one");
                }
            }
            else {
                const columnExp = new ComputedColumnExpression(entityExp.subSelect.entity, valExp as IExpression<ValueType>, prop);
                if (valExp instanceof MethodCallExpression && valExp.type === Number) {
                    columnExp.isNullable = false;
                }
                entityExp.subSelect.selects.push(columnExp);
                const projectedColumnExp = new ColumnExpression(entityExp, columnExp);
                projectedColumnExp.columnMeta = columnExp.columnMeta;
                entityExp.properties[prop] = projectedColumnExp;
                selectExp.selects.push(columnExp);
            }
        }

        return entityExp;
    }
    protected visitParameter<T>(exp: ParameterExpression<T>, context: IQueryVisitContext): IExpression<T> {
        let result = this.scopeParameters.get(exp.name) as IExpression<T>;
        if (!result) {
            const value = this.scopeParameters.get(`${this.parameterIndex}:${exp.name}`);
            if (value instanceof Queryable) {
                const selectExp = value.buildQuery(this) as SelectExpression<any, ElementType<T>>;
                selectExp.isSubSelect = true;
                context.selectExpression.addJoin(selectExp, null, "LEFT");
                return selectExp as unknown as IExpression<T>;
            }
            else if (value instanceof Function) {
                return new ValueExpression(value, exp.name) as unknown as IExpression<T>;
            }
            else if (value instanceof Array || value instanceof Enumerable) {
                const arrayParamExp = new ParameterExpression(this.parameterIndex + ":" + exp.name, Array as GenericType<Array<Extract<ElementType<T>, object>>>);
                arrayParamExp.itemType = exp.itemType;

                let schema: TSchema<Extract<ElementType<T>, object>> = this.scopeParameters.get(`${this.parameterIndex}:${exp.name}_itemtype`);
                if (!schema) {
                    schema = {} as TSchema<Extract<ElementType<T>, object>>;
                    const itemValue = value.find((o) => !!o) as Extract<ElementType<T>, object>;
                    if (!isNull(itemValue)) {
                        for (const prop in itemValue) {
                            const propValue = itemValue[prop];
                            if (isValue(propValue) || propValue === null) {
                                schema[prop] = propValue?.constructor as GenericType<any> ?? String;
                            }
                        }
                        schema.constructor = itemValue.constructor;
                    }
                }

                const entityExp = context.selectExpression.addSqlParameter(arrayParamExp, this.parameterIndex, this.newAlias(), schema);
                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = Object.values<IColumnExpression>(entityExp.properties).filter((o) => !o.isPrimary);
                selectExp.isSubSelect = true;
                context.selectExpression.addJoin(selectExp, null, "LEFT");
                return selectExp as unknown as IExpression<T>;
            }

            const sqlParamName = this.parameterIndex + ":" + exp.name;
            const sqlParamExp = context.selectExpression.paramExps
                .find(o => o.valueExp instanceof ParameterExpression && o.valueExp.name === sqlParamName) as SqlParameterExpression<T>;
            if (sqlParamExp) {
                context.selectExpression.paramExps.push(sqlParamExp);
                return sqlParamExp;
            }

            const paramExp = exp.clone();
            paramExp.name = sqlParamName;
            paramExp.itemType = exp.itemType;
            return context.selectExpression.addSqlParameter(paramExp);
        }
        else if (result instanceof SelectExpression && !(result instanceof GroupedExpression)) {
            // assumpt all selectExpression parameter come from groupJoin
            const rel = result.parentRelation as JoinRelation;
            const clone = (result as SelectExpression<any, ElementType<T>>).clone();
            // new alias is required.
            clone.entity.alias = this.newAlias();
            const replaceMap = new Map<IColumnExpression, IColumnExpression>();
            for (const oriCol of rel.childColumns) {
                replaceMap.set(oriCol, clone.entity.properties[oriCol.propertyName]);
            }
            for (const oriCol of rel.parentColumns) {
                replaceMap.set(oriCol, context.selectExpression.entity.properties[oriCol.propertyName]);
            }
            const relations = rel.relation.clone(replaceMap);
            context.selectExpression.addJoin(clone, relations, rel.type);
            result = clone as unknown as IExpression<T>;
        }

        return result;
    }
    protected visitTernaryOperator<T>(exp: TernaryExpression<T>, context: IQueryVisitContext): IExpression<T> {
        const logicalOperand = this.visit(exp.logicalOperand, context);
        const trueOperand = this.visit(exp.trueOperand, context);
        const falseOperand = this.visit(exp.falseOperand, context);

        const visitedExp = new TernaryExpression(logicalOperand, trueOperand, falseOperand);
        const isExpressionSafe = this.isSafe(visitedExp.logicalOperand) && this.isSafe(visitedExp.trueOperand) && this.isSafe(visitedExp.falseOperand);
        if (isExpressionSafe) {
            let hasParam = false;
            if (visitedExp.logicalOperand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(context.selectExpression.paramExps, visitedExp.logicalOperand);
                visitedExp.logicalOperand = visitedExp.logicalOperand.valueExp;
                hasParam = true;
            }
            if (visitedExp.trueOperand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(context.selectExpression.paramExps, visitedExp.trueOperand);
                visitedExp.trueOperand = visitedExp.trueOperand.valueExp;
                hasParam = true;
            }
            if (visitedExp.falseOperand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(context.selectExpression.paramExps, visitedExp.falseOperand);
                visitedExp.falseOperand = visitedExp.falseOperand.valueExp;
                hasParam = true;
            }
            if (hasParam) {
                return context.selectExpression.addSqlParameter(visitedExp);
            }
            return new ValueExpression(this.valueTransformer.execute(visitedExp));
        }

        return visitedExp;
    }
    protected visitUnaryOperator<T>(exp: IUnaryOperatorExpression<T>, context: IQueryVisitContext): IExpression<T> {
        if (exp instanceof SpreadExpression) {
            throw new Error("Spread expression not supported");
        }

        const operand = this.visit(exp.operand, context);

        const visitedExp = exp.clone(new Map([[exp.operand, operand]]));
        const isExpressionSafe = this.isSafe(visitedExp.operand);
        if (isExpressionSafe) {
            if (visitedExp.operand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(context.selectExpression.paramExps, visitedExp.operand);
                visitedExp.operand = visitedExp.operand.valueExp;
                return context.selectExpression.addSqlParameter(visitedExp);
            }
            return new ValueExpression(this.valueTransformer.execute(visitedExp));
        }

        return visitedExp;
    }
    //#endregion
}

const reverseJoin = <TChild extends object, TRoot extends object>(qv: RelationalQueryVisitor, childSelect: SelectExpression<TChild>, rootSelect?: SelectExpression<TRoot>, isExclusive?: boolean) => {
    let childExp = childSelect as unknown as SelectExpression;
    let root = rootSelect as unknown as SelectExpression;
    if (root instanceof GroupedExpression) {
        root = root.groupByExp;
    }
    if (childExp === root) {
        return childSelect;
    }

    const joinRels: JoinRelation[] = [];
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
        ArrayExtension.delete(parent.joins, joinRel);
        if (joinRel.isEmbedded) {
            // turn parent into child by using all child selects and includes.
            const cloneMap = new Map();
            mapReplaceExp(cloneMap, child.entity, parent.entity);

            parent.selects = child.selects.map((o) => {
                let col = parent.allColumns.find((c) => c.dataPropertyName === o.dataPropertyName);
                if (!col) {
                    col = o.clone(cloneMap);
                }
                return col;
            });
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

            if (child === childExp) {
                childExp = parent;
            }
        }
        else {
            let relationExp = joinRel.relation;

            if (joinRel.parentColumns.find(o => o.entity !== joinRel.parent.entity)) {
                // if parent column join use it's child column, use an alias column instead, 
                // coz it might has the same name with parent column name (colission)
                const replaceMap = new Map();
                for (const col of joinRel.childColumns) {
                    replaceMap.set(col, col);
                }
                for (const col of joinRel.parentColumns) {
                    if (col.entity === joinRel.parent.entity) {
                        replaceMap.set(col, col);
                        continue;
                    }

                    replaceMap.set(col.entity, col.entity);
                    const newCol = col.clone(replaceMap);
                    if (!newCol.alias) {
                        newCol.alias = qv.newAlias("column");
                    }
                }

                relationExp = resolveClone(joinRel.relation, replaceMap);
            }
            child.addJoin(parent, relationExp, "INNER", joinRel.isEmbedded);
        }
    }
    childExp.parentRelation = rootRel;
    if (rootRel) {
        ArrayExtension.add(childExp.selects, ...rootRel.childColumns);
        rootRel.child = childExp;
    }
    return childExp as unknown as SelectExpression<TChild>;
};
const createProjectionSelect = <TE extends object, T>(selectExp: SelectExpression<TE, T>) => {
    const parentRelation = selectExp.parentRelation;
    const projectEntityExp = new ProjectionEntityExpression(selectExp);
    const projectedSelectExp = new SelectExpression<TE>(projectEntityExp);
    projectedSelectExp.selects = projectEntityExp.selectedColumns.slice(0);
    if (parentRelation) {
        const replaceMap = new Map();
        for (const col of parentRelation.parentColumns) {
            replaceMap.set(col, col);
        }
        for (const oriCol of parentRelation.childColumns) {
            const col = projectEntityExp.properties[oriCol.propertyName as keyof TE];
            replaceMap.set(oriCol, col);
        }
        parentRelation.relation = resolveClone(parentRelation.relation, replaceMap);
        parentRelation.child = projectedSelectExp;
        projectedSelectExp.parentRelation = parentRelation;
    }

    return projectedSelectExp;
};
const reverseJoinTill = <TC, TP>(childSelectExp: SelectExpression<TC>, parentSelectExp: SelectExpression<TP>) => {
    let joinRel: JoinRelation = childSelectExp.entity.parentJoin;
    while (joinRel) {
        const reverseJoin = joinRel.reverse();
        childSelectExp.joins.push(reverseJoin);
        if (reverseJoin.child === parentSelectExp.entity) {
            parentSelectExp.entity.parentJoin = reverseJoin;
            break;
        }

        joinRel = joinRel.parent.parentJoin;
    }

    childSelectExp.paramExps.push(...parentSelectExp.paramExps);

    childSelectExp.addWhere(parentSelectExp.where);
    childSelectExp.setOrder(parentSelectExp.orders);
    return joinRel;
}