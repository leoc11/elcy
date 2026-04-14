import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { JoinType, OrderDirection, RelationshipType } from "../../Common/StringType";
import { ElementType, GenericType, IObjectType, MethodKey, StringKeyOf, ValueType } from "../../Common/Type";
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
import { isColumnExp, isEntityExp, isNativeFunction, isNotNull, isNull, isValue, isValueType, mapKeepExp, mapReplaceExp, resolveClone } from "../../Helper/Util";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { EmbeddedRelationMetaData } from "../../MetaData/EmbeddedColumnMetaData";
import { IBaseRelationMetaData } from "../../MetaData/Interface/IBaseRelationMetaData";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryTranslatorItem } from "../../Query/IQueryTranslatorItem";
import { IQueryVisitor } from "../../Query/IQueryVisitor";
import { IQueryVisitParameter } from "../../Query/IQueryVisitParameter";
import { NamingStrategy } from "../../Query/NamingStrategy";
import { QueryTranslator } from "../../Query/QueryTranslator";
import { IncludeRelation } from "../../Queryable/Interface/IncludeRelation";
import { JoinRelation } from "../../Queryable/Interface/JoinRelation";
import { PagingJoinRelation } from "../../Queryable/Interface/PagingJoinRelation";
import { Queryable } from "../../Queryable/Queryable";
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
            const visitParam: IQueryVisitParameter = {
                selectExpression: selectExp,
                scope: "orderBy"
            };
            this.visit(new MethodCallExpression(selectExp, "orderBy" as MethodKey<TE[]>, entityExp.defaultOrders), visitParam);
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
    public visit<T>(exp: IExpression<T>, param: IQueryVisitParameter): IExpression<T> {
        // TODO: need to remove clone as much as possible.
        switch (true) {
            case exp instanceof MethodCallExpression:
            case exp instanceof MemberAccessExpression: {
                exp.objectOperand = this.visit(exp.objectOperand, param);
                if (exp.objectOperand instanceof TernaryExpression) {
                    const ternaryExp = exp.objectOperand as TernaryExpression;
                    const trueOperand = exp;
                    trueOperand.objectOperand = ternaryExp.trueOperand;
                    const falseOperand = exp;
                    falseOperand.objectOperand = ternaryExp.falseOperand;
                    return new TernaryExpression(ternaryExp.logicalOperand, this.visit(trueOperand, param), this.visit(falseOperand, param));
                }
                return exp instanceof MemberAccessExpression ? this.visitMember(exp, param) : this.visitMethod(exp, param);
            }
            case exp instanceof FunctionCallExpression:
                return this.visitFunctionCall(exp as FunctionCallExpression<T>, param);
            case exp instanceof InstantiationExpression:
                return this.visitInstantiation(exp as InstantiationExpression<T>, param);
            case exp instanceof TernaryExpression:
                return this.visitTernaryOperator(exp as TernaryExpression<T>, param);
            case exp instanceof ObjectValueExpression:
                return this.visitObjectLiteral(exp as ObjectValueExpression<T & object>, param);
            case exp instanceof ArrayValueExpression:
                throw new Error(`literal Array not supported`);
            case exp instanceof FunctionExpression:
                return this.visitFunction(exp as FunctionExpression<T>, [], param);
            case exp instanceof ParameterExpression:
                return this.visitParameter(exp as ParameterExpression<T>, param);
            case exp instanceof SpreadExpression:
                throw new Error("Spread expression not supported");
            default: {
                if ((exp as IBinaryOperatorExpression).leftOperand) {
                    return this.visitBinaryOperator(exp as IBinaryOperatorExpression<T>, param);
                }
                else if ((exp as IUnaryOperatorExpression).operand) {
                    return this.visitUnaryOperator(exp as IUnaryOperatorExpression<T>, param);
                }
            }
        }
        return exp;
    }
    public visitFunction<T, TArgs extends readonly unknown[]>(exp: FunctionExpression<T, TArgs>, parameters: { [K in keyof TArgs]: IExpression<TArgs[K]>; }, param: IQueryVisitParameter): IExpression<T> {
        let i = 0;
        for (const paramExp of exp.params) {
            this.scopeParameters.add(paramExp.name, parameters[i++]);
        }
        const result = this.visit(exp.body, param);
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
    protected visitBinaryOperator<T, TE>(exp: IBinaryOperatorExpression<T>, param: IQueryVisitParameter): IExpression<T> {
        exp.leftOperand = this.visit(exp.leftOperand, param);
        exp.rightOperand = this.visit(exp.rightOperand, param);

        const isExpressionSafe = this.isSafe(exp.leftOperand) && this.isSafe(exp.rightOperand);
        if (isExpressionSafe) {
            let hasParam = false;
            if (exp.leftOperand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(param.selectExpression.paramExps, exp.leftOperand);
                exp.leftOperand = exp.leftOperand.valueExp;
                hasParam = true;
            }
            if (exp.rightOperand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(param.selectExpression.paramExps, exp.rightOperand);
                exp.rightOperand = exp.rightOperand.valueExp;
                hasParam = true;
            }
            if (hasParam) {
                return param.selectExpression.addSqlParameter(exp);
            }

            return new ValueExpression(this.valueTransformer.execute(exp));
        }

        if (exp.leftOperand instanceof TernaryExpression) {
            const ternaryExp = exp.leftOperand as TernaryExpression;
            const falseOperand = exp.clone();
            falseOperand.leftOperand = ternaryExp.falseOperand;
            const trueOperand = exp.clone();
            trueOperand.leftOperand = ternaryExp.trueOperand;
            return new TernaryExpression(ternaryExp.logicalOperand, this.visit(trueOperand, param), this.visit(falseOperand, param));
        }
        else if (exp.rightOperand instanceof TernaryExpression) {
            const ternaryExp = exp.rightOperand as TernaryExpression;
            const falseOperand = exp.clone();
            falseOperand.rightOperand = ternaryExp.falseOperand;
            const trueOperand = exp.clone();
            trueOperand.rightOperand = ternaryExp.trueOperand;
            return new TernaryExpression(ternaryExp.logicalOperand, this.visit(trueOperand, param), this.visit(falseOperand, param));
        }

        return exp;
    }
    protected visitFunctionCall<T>(exp: FunctionCallExpression<T>, param: IQueryVisitParameter): IExpression<T> {
        exp.fnExpression = this.visit(exp.fnExpression, param);
        if (!(exp.fnExpression instanceof ValueExpression)) {
            throw new Error("Function call expect a function");
        }

        exp.params = exp.params.map((o) => this.visit(o, param));
        const fn = exp.fnExpression.value as (...params: []) => T;

        const isExpressionSafe = exp.params.every((o) => this.isSafe(o));
        const translator = this.translator.resolve(fn);
        if (translator && (!isExpressionSafe || translator.isTranslate(exp))) {
            return exp;
        }

        // Execute function in application if all it's parameters available in application.
        if (isExpressionSafe) {
            let hasParam = false;
            exp.params = exp.params.map((o) => {
                if (o instanceof SqlParameterExpression) {
                    ArrayExtension.deleteLast(param.selectExpression.paramExps, o);
                    hasParam = true;
                    return o.valueExp;
                }
                return o;
            });

            if (hasParam) {
                return param.selectExpression.addSqlParameter(exp);
            }

            return new ValueExpression(this.valueTransformer.execute(exp));
        }

        // Try convert function as Expression
        if (!isNativeFunction(fn)) {
            const functionExp = ExpressionBuilder.parse(fn);
            const result = this.visitFunction(functionExp, exp.params as [], { selectExpression: param.selectExpression });
            return result;
        }
        return exp;
    }
    protected visitInstantiation<T>(exp: InstantiationExpression<T>, param: IQueryVisitParameter): IExpression<T> {
        exp.typeOperand = this.visit(exp.typeOperand, param) as ValueExpression<IObjectType<T>>;
        exp.params = exp.params.map((o) => this.visit(o, param));
        const isExpressionSafe = this.isSafe(exp.typeOperand) && exp.params.every((o) => this.isSafe(o));

        const translator = this.translator.resolve(exp.typeOperand.value);
        if (translator && (!isExpressionSafe || translator.isTranslate(exp))) {
            return exp;
        }

        if (isExpressionSafe) {
            let hasParam = false;
            exp.params = exp.params.map((o) => {
                if (o instanceof SqlParameterExpression) {
                    ArrayExtension.deleteLast(param.selectExpression.paramExps, o);
                    hasParam = true;
                    return o.valueExp;
                }
                return o;
            });

            if (hasParam) {
                return param.selectExpression.addSqlParameter(exp);
            }

            return new ValueExpression(this.valueTransformer.execute(exp));
        }

        throw new Error(`${exp.type.name} not supported.`);
    }
    protected visitMember<TE extends object, K extends StringKeyOf<TE>, T extends TE[K]>(exp: MemberAccessExpression<TE, K, T>, param: IQueryVisitParameter): IExpression<T> {
        const objectOperand = exp.objectOperand;
        if (exp.memberName === "prototype" || exp.memberName === "__proto__") {
            throw new Error(`property ${exp.memberName} not supported in linq to sql.`);
        }

        if (isEntityExp(objectOperand)) {
            let column = objectOperand.columns.find((c) => c.propertyName === exp.memberName) as IColumnExpression<TE, T>;
            if (!column) {
                const computedColumnMeta = getColumnMetadata(objectOperand.type as IObjectType<TE>, exp.memberName);
                if (computedColumnMeta instanceof ComputedColumnMetaData) {
                    const result = this.visitFunction(computedColumnMeta.functionExpression.clone(), [objectOperand], { selectExpression: param.selectExpression });
                    if (result instanceof EntityExpression || result instanceof SelectExpression) {
                        throw new Error(`${objectOperand.type.name}.${exp.memberName} not supported`);
                    }

                    column = new ComputedColumnExpression(objectOperand as IEntityExpression<TE>, result, exp.memberName);
                }
            }

            if (column) {
                if (param.scope === "project" && objectOperand.select) {
                    ArrayExtension.add(objectOperand.select.selects, column as IColumnExpression);
                }
                return column;
            }

            if (objectOperand.select) {
                const selectExp = objectOperand.select as SelectExpression<TE>;
                const colExp = selectExp.selects.find((c) => c.propertyName === exp.memberName) as IColumnExpression<any, T>;
                if (colExp) {
                    return colExp;
                }
                const include = selectExp.includes.find((c) => c.name === exp.memberName);
                if (include) {
                    const replaceMap = new Map();
                    const child = include.child.clone(replaceMap);
                    mapReplaceExp(replaceMap, selectExp.entity, objectOperand);
                    const relation = include.relation.clone(replaceMap);

                    switch (param.scope) {
                        case "project":
                        case "loads": {
                            selectExp.addInclude(include.name, child, relation, include.type, include.isEmbedded);
                            return include.type === "many" ? child as unknown as IExpression<T> : child.entity as IExpression<T>;
                        }
                        default:
                            {
                                let joinType: JoinType = "LEFT";
                                if (include.type === "one" && param.scope === "filter") {
                                    joinType = "INNER";
                                }

                                selectExp.addJoin(child, relation, joinType, include.isEmbedded);
                                return include.type === "many" ? child as unknown as IExpression<T> : child.entity as IExpression<T>;
                            }
                    }
                }
            }

            const relationMeta: IBaseRelationMetaData<TE, T & object> = getRelationMetadata(objectOperand.type as IObjectType<TE>, exp.memberName);
            if (relationMeta) {
                const targetType = relationMeta.target.type;
                const entityExp = new EntityExpression(targetType, this.newAlias());

                if (relationMeta instanceof EmbeddedRelationMetaData) {
                    for (const col of entityExp.columns) {
                        col.columnName = relationMeta.prefix + col.columnName;
                    }
                    entityExp.name = objectOperand.name;
                }

                switch (param.scope) {
                    case "project":
                    case "loads": {
                        const child = new SelectExpression(entityExp);
                        this.setDefaultBehaviour(child);
                        (objectOperand as IEntityExpression<TE>).select.addInclude(exp.memberName, child, relationMeta);
                        return relationMeta.relationType === "many" ? child as unknown as IExpression<T> : child.entity;
                    }
                    default: {
                        const child = new SelectExpression(entityExp);
                        this.setDefaultBehaviour(child);

                        const relJoin = (objectOperand as IEntityExpression<TE>).select.addJoin(child, relationMeta);
                        if (!(param.selectExpression instanceof GroupByExpression) && !(param.selectExpression instanceof GroupedExpression)) {
                            const paramSelectExp = param.selectExpression as SelectExpression<TE>;
                            paramSelectExp.joins.push(relJoin);
                            objectOperand.select.joins.pop();
                            relJoin.parent = paramSelectExp;
                        }
                        return relationMeta.relationType === "many" ? child as IExpression<ElementType<T>[]> as IExpression<T> : child.entity;
                    }
                }
            }
        }
        else if (objectOperand instanceof SelectExpression && exp.memberName === "length") {
            return this.visit(new MethodCallExpression(objectOperand, "count" as MethodKey<[]>, [objectOperand.entity]), param);
        }
        else if (objectOperand instanceof GroupedExpression) {
            if (exp.memberName === "key") {
                const result = objectOperand.key as IExpression<T & object>;
                if (isEntityExp(result)) {
                    switch (param.scope) {
                        case "project":
                        case "loads":
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
        else if (objectOperand instanceof SqlParameterExpression) {
            ArrayExtension.deleteLast(param.selectExpression.paramExps, objectOperand);
            exp.objectOperand = objectOperand.valueExp;
            return param.selectExpression.addSqlParameter(exp);
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
                if (translator && (!isExpressionSafe || translator.isTranslate(exp))) {
                    return exp;
                }
            }

            // Execute in app if all parameter is available.
            if (isExpressionSafe) {
                if (exp.objectOperand instanceof SqlParameterExpression) {
                    ArrayExtension.deleteLast(param.selectExpression.paramExps, exp.objectOperand);
                    exp.objectOperand = exp.objectOperand.valueExp;
                    return param.selectExpression.addSqlParameter(exp);
                }

                return new ValueExpression(this.valueTransformer.execute(exp));
            }
        }

        throw new Error(`${objectOperand.type.name}.${exp.memberName} is invalid or not supported in linq to sql.`);
    }
    protected visitMethod<TE, K extends MethodKey<TE>, T>(exp: MethodCallExpression<TE, K, T>, param: IQueryVisitParameter): IExpression<T> {
        const objectOperand = exp.objectOperand;

        if (objectOperand instanceof SelectExpression) {
            const objectOperandSelect = objectOperand as SelectExpression<ElementType<TE> & object>;
            let selectOperand = objectOperandSelect;
            switch (exp.methodName) {
                case "groupBy": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    const parentRelation = objectOperand.parentRelation;
                    const selectorFn = exp.params[0] as FunctionExpression<T, [unknown]>;
                    const visitParam: IQueryVisitParameter = {
                        selectExpression: selectOperand,
                        scope: exp.methodName
                    };
                    const selectExp = this.visitFunction(selectorFn, [selectOperand.getItemExpression()], visitParam) as IExpression<T & object>;
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
                        param.selectExpression = groupByExp;
                    }

                    return groupByExp as unknown as IExpression<T>;
                }
                case "map":
                case "flatMap": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    const cloneObjectOperand = selectOperand instanceof GroupedExpression && param.scope !== "flatMap" && param.scope !== "map" && param.scope !== "queryable";
                    const oriJoinCount = selectOperand.joins.length;

                    const selectorFn = (exp.params.length > 1 ? exp.params[1] : exp.params[0]) as FunctionExpression<T, [unknown]>;
                    const visitParam: IQueryVisitParameter = {
                        selectExpression: selectOperand,
                        scope: exp.methodName
                    };
                    let selectExp = this.visitFunction(selectorFn, [selectOperand.getItemExpression()], visitParam);

                    if (selectExp !== selectOperand.getItemExpression()) {
                        if (selectOperand instanceof GroupByExpression) {
                            selectOperand.isAggregate = true;
                        }

                        if (exp.methodName === "map") {
                            if (selectExp instanceof SelectExpression) {
                                // group result by relation to parent.
                                reverseJoin(this, selectExp, selectOperand, cloneObjectOperand);

                                const objExp = new ObjectValueExpression<Record<string, unknown>>({});
                                const paramExp = new ParameterExpression("o", selectExp.itemType);
                                for (const relCol of selectOperand.parentRelation.parentColumns) {
                                    objExp.object[relCol.propertyName] = relCol;
                                }
                                const fnExp = new FunctionExpression(objExp, [paramExp]);
                                const groupByMethodExp = new MethodCallExpression(selectExp, "groupBy" as MethodKey<[]>, [fnExp]);
                                const groupByExp = this.visit(groupByMethodExp, param) as GroupByExpression<ElementType<TE> & object>;
                                selectOperand = groupByExp;
                            }
                            else if (isEntityExp(selectExp)) {
                                const childExp = selectExp.select as SelectExpression<ElementType<TE> & object>;
                                // if child select did not have parent relation, that means that
                                // child select is replacement for current param.selectExpression
                                if (!childExp.parentRelation && selectOperand.parentRelation) {
                                    const parentRel = selectOperand.parentRelation;
                                    childExp.parentRelation = parentRel;
                                    parentRel.child = childExp;
                                    const replaceMap = new Map<IExpression, IExpression>([[selectOperand, childExp]]);
                                    for (const col of selectOperand.relationColumns) {
                                        const projectCol = childExp.entity.columns.find((o) => o.columnName === col.columnName);
                                        replaceMap.set(col, projectCol);
                                    }
                                    mapKeepExp(replaceMap, parentRel.parent);
                                    parentRel.relation = parentRel.relation.clone(replaceMap);
                                    selectOperand = childExp;
                                }
                                else {
                                    // return child select and add current select expression as a join relation.
                                    selectOperand = reverseJoin(this, childExp, selectOperand, cloneObjectOperand);
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
                                        let embeddedCol = cloneSelectExp.allColumns.find((o) => o.propertyName === pCol.propertyName);
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
                                        const entityExp = selectExp.entity as IEntityExpression<ElementType<TE> & object>;
                                        selectOperand = reverseJoin(this, entityExp.select, selectOperand, cloneObjectOperand);
                                        if (selectOperand.entity != entityExp) {
                                            colExp = selectOperand.allColumns.find((o) => o.dataPropertyName === colExp.dataPropertyName);
                                        }
                                        selectOperand.itemExpression = colExp;
                                        selectOperand.selects = [colExp];
                                    }
                                }
                                else if (selectExp instanceof TernaryExpression) {
                                    // TODO
                                }
                                else {
                                    const column = new ComputedColumnExpression(selectOperand.entity, selectExp as IExpression<T & ValueType>, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                                    selectOperand.itemExpression = column;
                                    selectOperand.selects = [column];
                                }
                            }
                        }
                        else {
                            if (!(selectExp instanceof SelectExpression)) {
                                throw new Error(`Queryable<${objectOperand.itemType.name}>.flatMap required selector with array or queryable or enumerable return value.`);
                            }
                            selectOperand = reverseJoin(this, selectExp, selectOperand, cloneObjectOperand);
                        }

                        if (!selectOperand.isSubSelect) {
                            // inherit all parameters
                            selectOperand.paramExps = param.selectExpression.paramExps;
                            param.selectExpression = selectOperand;
                        }
                    }

                    const type = exp.params.length > 1 ? exp.params[0] as ValueExpression<GenericType> : null;
                    if (type) {
                        selectOperand.itemExpression.type = type.value;
                    }

                    return selectOperand as unknown as IExpression<T>;
                }
                case "project":
                case "loads": {
                    if (exp.methodName === "project") {
                        objectOperand.selects = [];
                    }
                    const paramExpCount = selectOperand.paramExps.length;
                    for (const paramFn of exp.params) {
                        const selectorFn = paramFn as FunctionExpression<T, [unknown]>;
                        const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: exp.methodName };
                        const childSelect = this.visitFunction(selectorFn, [selectOperand.getItemExpression()], visitParam) as unknown as SelectExpression;

                        // move all new parameter to loaded child select
                        if (!childSelect.paramExps) {
                            childSelect.paramExps = [];
                        }
                        childSelect.paramExps.push(...selectOperand.paramExps.slice(paramExpCount));
                        selectOperand.paramExps.splice(paramExpCount, selectOperand.paramExps.length - paramExpCount);
                    }
                    return selectOperand as unknown as IExpression<T>;
                }
                case "filter": {
                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    if (param.scope === "select-object" && selectOperand instanceof GroupedExpression) {
                        const entityExp = selectOperand.entity.clone();
                        entityExp.alias = this.newAlias();
                        const selectExp = new SelectExpression(entityExp);
                        let relation: IExpression<boolean>;
                        for (const parentCol of selectOperand.entity.primaryColumns) {
                            const childCol = entityExp.columns.find((o) => o.columnName === parentCol.columnName);
                            const logicalExp = new StrictEqualExpression(parentCol, childCol);
                            relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                        }
                        selectOperand.addJoin(selectExp, relation, "LEFT");
                        selectOperand = selectExp;
                    }

                    const predicateFn = exp.params[0] as FunctionExpression<boolean, [unknown]>;
                    const visitParam: IQueryVisitParameter = {
                        selectExpression: selectOperand,
                        scope: "filter"
                    };
                    const whereExp = this.visitFunction(predicateFn, [selectOperand.getItemExpression()], visitParam);

                    if (whereExp.type !== Boolean) {
                        throw new Error(`Queryable<${objectOperand.itemType.name}>.where required predicate with boolean return value.`);
                    }

                    selectOperand.addWhere(whereExp);
                    return selectOperand as unknown as IExpression<T>;
                }
                case "includes": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    let item = exp.params[0] as IExpression<ElementType<TE> & object>;
                    let andExp: IExpression<boolean>;
                    const isSubSelect = objectOperandSelect.isSubSelect;
                    if (isSubSelect) {
                        item = this.visit(item, param);
                        objectOperandSelect.distinct = true;
                        ArrayExtension.delete(objectOperandSelect.parentRelation.parent.joins, objectOperandSelect.parentRelation as any);
                        objectOperandSelect.parentRelation = null;
                        return new MethodCallExpression(objectOperandSelect, "includes", [item]);
                    }
                    else if (objectOperandSelect.itemType === objectOperandSelect.entity.type) {
                        for (const primaryCol of objectOperandSelect.entity.primaryColumns) {
                            const d = new EqualExpression(primaryCol, new MemberAccessExpression(item, primaryCol.propertyName));
                            andExp = andExp ? new AndExpression(andExp, d) : d;
                        }
                    }
                    else {
                        andExp = new EqualExpression(objectOperandSelect.selects.find(() => true), item);
                    }

                    if (param.scope === "queryable") {
                        objectOperandSelect.addWhere(andExp);
                        const column = new ComputedColumnExpression(objectOperandSelect.entity, new ValueExpression(true), this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        objectOperandSelect.selects = [column];
                        objectOperandSelect.paging.take = new ValueExpression(1);
                        objectOperandSelect.distinct = true;
                        return objectOperand as unknown as IExpression<T>;
                    }

                    return andExp as IExpression<T>;
                }
                case "distinct": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    objectOperand.distinct = true;
                    return objectOperand as unknown as IExpression<T>;
                }
                case "orderBy": {
                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    let pagingJoin: PagingJoinRelation<ElementType<TE> & object>;
                    if (param.scope !== "queryable") {
                        pagingJoin = Enumerable.from(objectOperand.joins).ofType<PagingJoinRelation>(PagingJoinRelation).find();
                    }

                    const hasPaging = pagingJoin;
                    if (hasPaging) {
                        const cloneMap = new Map();
                        const includes = selectOperand.includes;
                        selectOperand.includes = [];

                        const newSelect = selectOperand.clone(cloneMap);
                        newSelect.entity.alias = this.newAlias();
                        newSelect.selects = [];
                        selectOperand.includes = includes;
                        selectOperand.where = null;

                        let relationExp: IExpression<boolean> = null;
                        for (const col of selectOperand.primaryKeys) {
                            const cloneCol = resolveClone(col, cloneMap);
                            const logicalExp = new StrictEqualExpression(col, cloneCol);
                            relationExp = relationExp ? new AndExpression(relationExp, logicalExp) : logicalExp;
                        }
                        selectOperand.addJoin(newSelect, relationExp, "INNER");
                        selectOperand.paging = {};
                        if (pagingJoin) {
                            ArrayExtension.delete(selectOperand.joins, pagingJoin);
                        }
                    }

                    const selectors = exp.params as ArrayValueExpression[];
                    const orders: IOrderExpression[] = [];
                    for (const selector of selectors) {
                        const selectorFn = selector.items[0] as FunctionExpression<unknown, [unknown]>;
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
                        objectOperand.setOrder(orders);
                    }
                    return objectOperand as unknown as IExpression<T>;
                }
                case "count": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    const countExp = new MethodCallExpression(objectOperand as IExpression<TE>, exp.methodName, [objectOperand.entity], Number);
                    const parentRel = selectOperand.parentRelation as JoinRelation<any, ElementType<TE> & object>;
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(objectOperand.entity, countExp, this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.itemExpression = column;
                        objectOperand.distinct = true;
                        return objectOperand as unknown as IExpression<T>;
                    }
                    else if (selectOperand instanceof GroupedExpression || (parentRel?.parent instanceof GroupByExpression)) {
                        // don't select unnecessary column
                        if (param.scope && param.scope.indexOf("map") === 0) {
                            selectOperand.selects = [];
                        }
                        return countExp as unknown as IExpression<T>;
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
                        groupExp.isAggregate = true;
                        const column = new ComputedColumnExpression(groupExp.entity, countExp as unknown as IExpression<Extract<number, T>>, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
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
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = parentSelect.projectedColumns.find((o) => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregate = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation, "LEFT");
                            ArrayExtension.add(groupedBridge.selects, bridgeColumn);

                            return bridgeColumn;
                        }

                        return new NullCoalesceExpression(column, new ValueExpression(0 as Extract<Number, T>));
                    }
                }
                case "sum":
                case "avg": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    if (exp.params.length > 0) {
                        const selectorFn = exp.params[0] as FunctionExpression;
                        const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: param.scope };
                        const selectExpression = this.visit(new MethodCallExpression(objectOperand, "map", [selectorFn]), visitParam) as SelectExpression;
                        param.selectExpression = visitParam.selectExpression;

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
                    }), Number as unknown as GenericType<Extract<number, T>>);
                    const parentRel = selectOperand.parentRelation as JoinRelation;
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(selectOperand.entity, aggregateExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        objectOperand.selects = [column];
                        objectOperand.distinct = true;
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
                        groupExp.isAggregate = true;
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
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = parentSelect.projectedColumns.find((o) => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregate = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation, "LEFT");
                            ArrayExtension.add(groupedBridge.selects, bridgeColumn);

                            return bridgeColumn;
                        }

                        return new NullCoalesceExpression(column, new ValueExpression(0 as Extract<Number, T>));
                    }
                }
                case "max":
                case "min": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    if (exp.params.length > 0) {
                        const selectorFn = exp.params[0] as FunctionExpression;
                        const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: param.scope };
                        const selectExpression = this.visit(new MethodCallExpression(objectOperand, "map", [selectorFn]), visitParam) as SelectExpression;
                        param.selectExpression = visitParam.selectExpression;

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
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(selectOperand.entity, aggregateExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        objectOperand.selects = [column];
                        objectOperand.distinct = true;
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
                        groupExp.isAggregate = true;
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
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = parentSelect.projectedColumns.find((o) => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregate = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation, "LEFT");
                            ArrayExtension.add(groupedBridge.selects, bridgeColumn);

                            return bridgeColumn;
                        }

                        return column;
                    }
                }
                case "join": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
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
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(selectOperand.entity, aggregateExp, this.newAlias("column") as StringKeyOf<ElementType<TE>>);
                        objectOperand.selects = [column];
                        objectOperand.distinct = true;
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
                        groupExp.isAggregate = true;
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
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = parentSelect.projectedColumns.find((o) => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregate = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation, "LEFT");
                            ArrayExtension.add(groupedBridge.selects, bridgeColumn);

                            return bridgeColumn;
                        }

                        return column;
                    }
                }
                case "every":
                case "some": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
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
                        const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: param.scope };
                        this.visit(new MethodCallExpression(selectOperand, "filter", [predicateFn]), visitParam);
                    }

                    const anyExp = new ValueExpression(isAny as boolean & T);
                    const parentRel = selectOperand.parentRelation as JoinRelation;
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(objectOperand.entity, anyExp, this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.paging.take = new ValueExpression(1);
                        objectOperand.distinct = true;
                        return objectOperand as unknown as IExpression<T>;
                    }
                    else if (selectOperand instanceof GroupedExpression || (parentRel && parentRel.parent instanceof GroupByExpression)) {
                        // don't select unnecessary column
                        if (param.scope && param.scope.indexOf("map") === 0) {
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
                        groupExp.isAggregate = true;
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
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                groupKey.object[primaryCol.propertyName] = primaryCol;
                                const pCol = parentSelect.projectedColumns.find((o) => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }

                            const groupedBridge = new GroupByExpression(bridge, groupKey);
                            groupedBridge.isAggregate = true;

                            parentSelect.addJoin(groupedBridge, bridgeParentRelation, "LEFT");
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
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    if (selectOperand.paging.skip) {
                        selectOperand = createProjectionSelect(selectOperand);
                    }

                    if (exp.params.length > 0) {
                        const predicateFn = exp.params[0] as FunctionExpression;
                        const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: exp.methodName };
                        this.visit(new MethodCallExpression(selectOperand, "filter", [predicateFn]), visitParam);
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
                            const sortCol = sorter.entity.columns.find((col) => col.propertyName === relCol.propertyName);
                            const filterCol = filterer.entity.columns.find((col) => col.propertyName === relCol.propertyName);
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
                    return selectOperand.entity as unknown as IExpression<T>;
                }
                case "slice": {
                    let startExp = exp.params[0] as ParameterExpression<number>;
                    let endExp: ParameterExpression<number>;
                    if (exp.params.length > 1) {
                        endExp = exp.params.length > 1 ? exp.params[1] as ParameterExpression<number> : undefined;
                    }

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

                        if (selectOperand.paging.take) {
                            selectOperand.paging.take = this.visit<number>(new SubstractionExpression(selectOperand.paging.take, startExp), param);
                        }
                        selectOperand.paging.skip = this.visit(selectOperand.paging.skip ? new AdditionExpression(selectOperand.paging.skip, startExp) : startExp, param);

                        if (endExp) {
                            selectOperand.paging.take = this.visit(selectOperand.paging.take ? new MethodCallExpression(new ValueExpression(Math), "min", [selectOperand.paging.take, endExp]) : endExp, param);
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

                            let joinExp: IExpression<boolean>;
                            for (const relCol of relationColumns) {
                                const sortCol = sorter.entity.columns.find((col) => col.propertyName === relCol.propertyName);
                                const filterCol = filterer.entity.columns.find((col) => col.propertyName === relCol.propertyName);
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
                            innerGroupExp.isAggregate = true;
                            innerGroupExp.selects.push(colCountExp);

                            // add join relation to current object operand
                            let joinRelation: IExpression<boolean>;
                            for (let i = 0, len = entityExp.primaryColumns.length; i < len; i++) {
                                const objCol = entityExp.primaryColumns[i];
                                const groupCol = innerGroupExp.entity.primaryColumns[i];
                                const logicalExp = new StrictEqualExpression(objCol, groupCol);
                                joinRelation = joinRelation ? new AndExpression(joinRelation, logicalExp) : logicalExp;
                            }

                            pagingJoinRel = new PagingJoinRelation(objectOperand, innerGroupExp, joinRelation, "INNER");
                            objectOperand.joins.push(pagingJoinRel);
                            innerGroupExp.parentRelation = pagingJoinRel;
                        }

                        const groupExp = pagingJoinRel.child as GroupByExpression;
                        const countExp = (Enumerable.from(groupExp.selects).except(groupExp.groupBy).find() as ComputedColumnExpression).expression;

                        const pagingStartExp = pagingJoinRel.start ? new AdditionExpression(pagingJoinRel.start, startExp) : startExp;
                        pagingJoinRel.start = this.visit(pagingStartExp, param);
                        if (endExp) {
                            pagingJoinRel.end = this.visit(pagingStartExp ? new AdditionExpression(pagingStartExp, endExp) : endExp, param);
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
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    const visitParam: IQueryVisitParameter = { selectExpression: param.selectExpression, scope: exp.methodName };
                    if (param.scope === "select-object" && visitParam.selectExpression.parentRelation) {
                        visitParam.selectExpression = visitParam.selectExpression.parentRelation.parent;
                    }
                    const childSelectOperands: [SelectExpression<ElementType<TE> & object>, ...SelectExpression<ElementType<TE> & object>[]] = exp.params.map(px => {
                        const childOp = this.visit(px, { ...visitParam }) as SelectExpression<ElementType<TE> & object>;
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
                    param.selectExpression = visitParam.selectExpression;

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
                            const col = selectOperand.selects.find(o => o.columnName === oriCol.columnName);
                            replaceMap.set(oriCol, col);
                        }
                        parentRelation.relation = resolveClone(parentRelation.relation, replaceMap);
                        parentRelation.child = selectOperand;
                        selectOperand.parentRelation = parentRelation;
                    }
                    else {
                        param.selectExpression = selectOperand;
                    }
                    return selectOperand as unknown as IExpression<T>;
                }
                case "innerJoin":
                case "leftJoin":
                case "rightJoin":
                case "fullJoin":
                case "groupJoin": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    const parentRelation = objectOperand.parentRelation;
                    const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: "join" };
                    const childSelectOperand = this.visit(exp.params[0], visitParam) as SelectExpression;

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
                    const relation = this.visitFunction(relationSelector, [selectOperand.getItemExpression(), childSelectOperand.getItemExpression()], visitParam);

                    if (exp.methodName === "groupJoin") {
                        childSelectOperand.parentRelation = new JoinRelation(selectOperand, childSelectOperand, relation, jointType);
                    }
                    else {
                        selectOperand.addJoin(childSelectOperand, relation, jointType);
                    }

                    const resultVisitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: "join" };
                    const resultSelector = exp.params[2] as FunctionExpression<unknown, [unknown, unknown]>;
                    const paramExp = resultSelector.params.pop();
                    this.scopeParameters.add(paramExp.name, exp.methodName === "groupJoin" ? childSelectOperand : childSelectOperand.getItemExpression());
                    this.visit(new MethodCallExpression(selectOperand, "map", [resultSelector]), resultVisitParam);
                    this.scopeParameters.remove(paramExp.name);
                    if (parentRelation) {
                        parentRelation.child = selectOperand;
                        selectOperand.parentRelation = parentRelation;
                    }
                    else {
                        param.selectExpression = selectOperand;
                    }

                    return selectOperand as unknown as IExpression<T>;
                }
                case "crossJoin": {
                    if (param.scope === "loads" || param.scope === "project") {
                        throw new Error(`${param.scope} did not support ${exp.methodName}`);
                    }

                    const parentRelation = objectOperand.parentRelation;
                    const visitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: "join" };
                    const childSelectOperand = this.visit(exp.params[0], visitParam) as SelectExpression;
                    selectOperand.addJoin(childSelectOperand, null, "CROSS");

                    const resultVisitParam: IQueryVisitParameter = { selectExpression: selectOperand, scope: "join" };
                    const resultSelector = exp.params[1] as FunctionExpression<unknown, [unknown, unknown]>;
                    const paramExp = resultSelector.params.pop();
                    this.scopeParameters.add(paramExp.name, childSelectOperand.getItemExpression());
                    this.visit(new MethodCallExpression(selectOperand, "map", [new ValueExpression(Object), resultSelector]), resultVisitParam);
                    this.scopeParameters.remove(paramExp.name);
                    if (parentRelation) {
                        parentRelation.child = selectOperand;
                        selectOperand.parentRelation = parentRelation;
                    }
                    else {
                        param.selectExpression = selectOperand;
                    }

                    return selectOperand as unknown as IExpression<T>;
                }
                case "toArray": {
                    return objectOperand as unknown as IExpression<T>;
                }
            }
            throw new Error(`${exp.methodName} not supported on expression`);
        }
        else {
            exp.params = exp.params.map((o) => this.visit(o, { selectExpression: param.selectExpression }));
            if (objectOperand instanceof ValueExpression) {
                const value = objectOperand.value;
                if (value === Enumerable) {
                    switch (exp.methodName) {
                        case "from": {
                            return exp.params[0] as IExpression<T>;
                        }
                    }
                }
            }

            const isObjectOperandSafe = this.isSafe(objectOperand);
            const isExpressionSafe = isObjectOperandSafe && exp.params.every((o) => this.isSafe(o));

            let objectOperandValue: any;
            if (isObjectOperandSafe) {
                let a = objectOperand;
                if (a instanceof SqlParameterExpression) {
                    const value = this.valueTransformer.execute(a.valueExp);
                    a = new ValueExpression(value);
                    // TODO: remove sqlparameter
                }

                if (a instanceof ValueExpression) {
                    objectOperandValue = a.value;
                }
            }

            let translator: IQueryTranslatorItem;
            if (isNotNull(objectOperandValue)) {
                translator = this.translator.resolve(objectOperandValue, exp.methodName);
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
                if (exp.objectOperand instanceof SqlParameterExpression) {
                    ArrayExtension.deleteLast(param.selectExpression.paramExps, exp.objectOperand);
                    exp.objectOperand = exp.objectOperand.valueExp;
                    hasParam = true;
                }
                exp.params = exp.params.map((o) => {
                    if (o instanceof SqlParameterExpression) {
                        ArrayExtension.deleteLast(param.selectExpression.paramExps, o);
                        hasParam = true;
                        return o.valueExp;
                    }
                    return o;
                });

                if (hasParam) {
                    return param.selectExpression.addSqlParameter(exp);
                }

                return new ValueExpression(this.valueTransformer.execute(exp));
            }

            const methodFn: (...args: unknown[]) => unknown = objectOperandValue ? objectOperandValue[exp.methodName] : objectOperand.type.prototype[exp.methodName];
            if (methodFn && !isNativeFunction(methodFn)) {
                // try convert user defined method to a FunctionExpression and built it as a query.
                const methodExp = ExpressionBuilder.parse(methodFn);
                methodExp.params.unshift(new ParameterExpression("this", exp.objectOperand.type));
                const params = [exp.objectOperand as IExpression<unknown>].concat(exp.params);
                return this.visitFunction(methodExp, params, { selectExpression: param.selectExpression }) as IExpression<T>;
            }
        }
        throw new Error(`${exp.methodName} not supported.`);
    }
    protected visitObjectLiteral<TE extends object>(expression: ObjectValueExpression<TE>, param: IQueryVisitParameter): IEntityExpression<TE> {
        let requireCopy = false;
        const requireAlias = param.scope !== "groupBy";
        switch (param.scope) {
            case "groupBy":
            case "select-object": {
                requireCopy = true;
                break;
            }
            case "map": {
                break;
            }
            default: {
                throw new Error("Operation not supported");
            }
        }

        const selectExp = param.selectExpression;
        const isGrouped = selectExp instanceof GroupByExpression;
        const entityExp = selectExp.entity;

        let embeddedEntity = entityExp as unknown as IEntityExpression<TE>;
        let embeddedSelect = selectExp as unknown as SelectExpression<TE>;
        const possibleKeys: string[] = [];
        if (requireCopy) {
            embeddedEntity = entityExp.clone() as unknown as IEntityExpression<TE>;
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
            const visitParam: IQueryVisitParameter = {
                selectExpression: embeddedSelect as unknown as SelectExpression,
                scope: "select-object"
            };
            valExp = expression.object[prop] = this.visit(valExp, visitParam);

            if (valExp instanceof SelectExpression) {
                if (isGrouped) {
                    if (valExp instanceof GroupedExpression && valExp.groupByExp === embeddedSelect) {
                        const parentGroupExp = embeddedSelect as GroupByExpression<TE>;
                        const childSelectExp = parentGroupExp.clone();
                        const childEntity = childSelectExp.entity;
                        childEntity.alias = this.newAlias();

                        const replaceMap1 = new Map();
                        mapReplaceExp(replaceMap1, entityExp, childEntity);
                        let relation: IExpression<boolean>;
                        for (const pCol of parentGroupExp.primaryKeys) {
                            const childCol = childSelectExp.primaryKeys.find((o) => o.propertyName === pCol.propertyName);
                            const logicalExp = new StrictEqualExpression(pCol, childCol);
                            relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                        }
                        const include = embeddedSelect.addInclude(prop, childSelectExp, relation, "one");
                        ArrayExtension.delete(embeddedSelect.includes, include);
                        includes.push(include);
                    }
                    else {
                        const include = joinToInclude(valExp, embeddedSelect, prop, "many");
                        ArrayExtension.delete(embeddedSelect.includes, include);
                        includes.push(include);
                    }
                }
                else {
                    const include = joinToInclude(valExp, embeddedSelect, prop, "many");
                    ArrayExtension.delete(embeddedSelect.includes, include);
                    includes.push(include);
                }
            }
            else if (isEntityExp(valExp)) {
                if (valExp === embeddedSelect.entity as IEntityExpression) {
                    const childSelectExp = embeddedSelect.clone();
                    const entityClone = childSelectExp.entity;
                    entityClone.alias = this.newAlias();
                    let relation: IExpression<boolean>;
                    for (const pCol of entityClone.primaryColumns) {
                        const childCol = valExp.primaryColumns.find((o) => o.propertyName === pCol.propertyName);
                        const logicalExp = new StrictEqualExpression(pCol, childCol);
                        relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                    }
                    const include = embeddedSelect.addInclude(prop, childSelectExp, relation, "one");
                    ArrayExtension.delete(embeddedSelect.includes, include);
                    includes.push(include);
                }
                else {
                    const childSelectExp = valExp.select;
                    const include = joinToInclude(childSelectExp, embeddedSelect, prop, "one");
                    ArrayExtension.delete(embeddedSelect.includes, include);
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
                    columnExp = valExp.clone(cloneMap) as IColumnExpression;
                    columnExp.propertyName = prop;
                }
                if (requireAlias && !columnExp.alias) {
                    columnExp.alias = this.newAlias("column");
                }
                selects.push(columnExp);
            }
            else {
                const columnExp = new ComputedColumnExpression(embeddedEntity, valExp as IExpression<ValueType>, prop, this.newAlias("column"));
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
                const embeddedCol = embeddedSelect.primaryKeys.find((o) => o.propertyName === pCol.propertyName);
                const logicalExp = new StrictEqualExpression(pCol, embeddedCol);
                relations = relations ? new AndExpression(relations, logicalExp) : logicalExp;
            }
            selectExp.addJoin(embeddedSelect, relations, "INNER", true);
        }

        return embeddedSelect.entity;
    }
    protected visitParameter<T>(exp: ParameterExpression<T>, param: IQueryVisitParameter): IExpression<T> {
        let result = this.scopeParameters.get(exp.name) as IExpression<T>;
        if (!result) {
            const value = this.scopeParameters.get(`${this.parameterIndex}:${exp.name}`);
            if (value instanceof Queryable) {
                const selectExp = value.buildQuery(this) as SelectExpression<any, ElementType<T>>;
                selectExp.isSubSelect = true;
                param.selectExpression.addJoin(selectExp, null, "LEFT");
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

                const entityExp = param.selectExpression.addSqlParameter(arrayParamExp, this.parameterIndex, this.newAlias(), schema);
                const selectExp = new SelectExpression(entityExp);
                selectExp.selects = entityExp.columns.filter((o) => !o.isPrimary);
                selectExp.isSubSelect = true;
                param.selectExpression.addJoin(selectExp, null, "LEFT");
                return selectExp as unknown as IExpression<T>;
            }

            const sqlParamName = this.parameterIndex + ":" + exp.name;
            const sqlParamExp = param.selectExpression.paramExps
                .find(o => o.valueExp instanceof ParameterExpression && o.valueExp.name === sqlParamName) as SqlParameterExpression<T>;
            if (sqlParamExp) {
                param.selectExpression.paramExps.push(sqlParamExp);
                return sqlParamExp;
            }

            const paramExp = exp.clone();
            paramExp.name = sqlParamName;
            paramExp.itemType = exp.itemType;
            return param.selectExpression.addSqlParameter(paramExp);
        }
        else if (result instanceof SelectExpression && !(result instanceof GroupedExpression)) {
            // assumpt all selectExpression parameter come from groupJoin
            const rel = result.parentRelation as JoinRelation;
            const clone = (result as SelectExpression<any, ElementType<T>>).clone();
            // new alias is required.
            clone.entity.alias = this.newAlias();
            const replaceMap = new Map<IColumnExpression, IColumnExpression>();
            for (const oriCol of rel.childColumns) {
                replaceMap.set(oriCol, clone.entity.columns.find((o) => o.columnName === oriCol.columnName));
            }
            for (const oriCol of rel.parentColumns) {
                replaceMap.set(oriCol, param.selectExpression.entity.columns.find((o) => o.columnName === oriCol.columnName));
            }
            const relations = rel.relation.clone(replaceMap);
            param.selectExpression.addJoin(clone, relations, rel.type);
            result = clone as unknown as IExpression<T>;
        }

        return result;
    }
    protected visitTernaryOperator<T>(exp: TernaryExpression<T>, param: IQueryVisitParameter): IExpression<T> {
        exp.logicalOperand = this.visit(exp.logicalOperand, param);
        exp.trueOperand = this.visit(exp.trueOperand, param);
        exp.falseOperand = this.visit(exp.falseOperand, param);

        const isExpressionSafe = this.isSafe(exp.logicalOperand) && this.isSafe(exp.trueOperand) && this.isSafe(exp.falseOperand);
        if (isExpressionSafe) {
            let hasParam = false;
            if (exp.logicalOperand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(param.selectExpression.paramExps, exp.logicalOperand);
                exp.logicalOperand = exp.logicalOperand.valueExp;
                hasParam = true;
            }
            if (exp.trueOperand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(param.selectExpression.paramExps, exp.trueOperand);
                exp.trueOperand = exp.trueOperand.valueExp;
                hasParam = true;
            }
            if (exp.falseOperand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(param.selectExpression.paramExps, exp.falseOperand);
                exp.falseOperand = exp.falseOperand.valueExp;
                hasParam = true;
            }
            if (hasParam) {
                return param.selectExpression.addSqlParameter(exp);
            }
            return new ValueExpression(this.valueTransformer.execute(exp));
        }
        return exp;
    }
    protected visitUnaryOperator<T, TE>(exp: IUnaryOperatorExpression<T>, param: IQueryVisitParameter): IExpression<T> {
        exp.operand = this.visit(exp.operand, param);

        const isExpressionSafe = this.isSafe(exp.operand);
        if (isExpressionSafe) {
            if (exp.operand instanceof SqlParameterExpression) {
                ArrayExtension.deleteLast(param.selectExpression.paramExps, exp.operand);
                exp.operand = exp.operand.valueExp;
                return param.selectExpression.addSqlParameter(exp);
            }
            return new ValueExpression(this.valueTransformer.execute(exp));
        }

        if (exp.operand instanceof TernaryExpression) {
            const ternaryExp = exp.operand as TernaryExpression;
            const falseOperand = exp.clone();
            falseOperand.operand = ternaryExp.falseOperand;
            const trueOperand = exp.clone();
            trueOperand.operand = ternaryExp.trueOperand;
            return new TernaryExpression(ternaryExp.logicalOperand, trueOperand, falseOperand);
        }
        return exp;
    }
    //#endregion
}

const joinToInclude = <TChild extends object, TParent extends object>(childExp: SelectExpression<TChild>, parentExp: SelectExpression<TParent>, name: string, relationType: RelationshipType) => {
    let parentRel = childExp.parentRelation as JoinRelation<TParent, TChild>;
    while (parentRel && (parentRel as any).name === undefined && parentRel.parent !== parentExp) {
        const nextRel = parentRel.parent.parentRelation as JoinRelation<any, any>;
        ArrayExtension.delete(parentRel.parent.joins, parentRel);
        parentRel.child.addJoin(parentRel.parent, parentRel.relation, "INNER");
        if (!parentRel) {
            break;
        }
        parentRel = nextRel;
    }

    if (!parentRel) {
        return null;
    }

    ArrayExtension.delete(parentExp.joins, parentRel);
    const includeRel = parentExp.addInclude(name, childExp, parentRel.relation, relationType, parentRel.isEmbedded);
    return includeRel;
};

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
            const col = projectedSelectExp.selects.find(o => o.columnName === oriCol.columnName);
            replaceMap.set(oriCol, col);
        }
        parentRelation.relation = resolveClone(parentRelation.relation, replaceMap);
        parentRelation.child = projectedSelectExp;
        projectedSelectExp.parentRelation = parentRelation;
    }

    return projectedSelectExp;
}