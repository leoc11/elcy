import "../Extensions/StringExtension";
import { JoinType, OrderDirection, RelationshipType, GenericType } from "../Common/Type";
import { relationMetaKey, columnMetaKey } from "../Decorator/DecoratorKey";
import { TransformerParameter } from "../ExpressionBuilder/TransformerParameter";
import { isValueType, isNativeFunction, visitExpression, isValue, replaceExpression } from "../Helper/Util";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { SelectExpression, IJoinRelation, IIncludeRelation } from "../Queryable/QueryExpression/SelectExpression";
import { GroupedExpression } from "../Queryable/QueryExpression/GroupedExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";
import { InstantiationExpression } from "../ExpressionBuilder/Expression/InstantiationExpression";
import { RelationMetaData } from "../MetaData/Relation/RelationMetaData";
import { EmbeddedColumnExpression } from "../Queryable/QueryExpression/EmbeddedColumnExpression";
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
import { EmbeddedColumnMetaData } from "../MetaData/EmbeddedColumnMetaData";
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

interface IPRelation {
    name: string;
    relations: IExpression<boolean>;
    // relations: Map<any, any>;
    child: SelectExpression<any>;
    type: RelationshipType;
}
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
                param.selectExpression.addJoinRelation(selectExp, null, JoinType.LEFT);
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
                param.selectExpression.addJoinRelation(selectExp, null, JoinType.LEFT);
                sqlParameterExp.select = selectExp;
                return selectExp;
            }

            const paramExp = new ParameterExpression(this.parameterStackIndex + ":" + expression.name, expression.type);
            paramExp.itemType = expression.itemType;
            return this.createParamBuilderItem(paramExp, param);
        }
        else if (result instanceof SelectExpression && !(result instanceof GroupedExpression)) {
            // assumpt all selectExpression parameter come from groupJoin
            const rel = result.parentRelation as IJoinRelation;
            const clone = result.clone();
            const replaceMap = new Map<IColumnExpression, IColumnExpression>();
            for (const oriCol of result.entity.columns) {
                replaceMap.set(oriCol, clone.entity.columns.find(o => o.columnName === oriCol.columnName));
            }
            const relations = rel.relations.clone(replaceMap);
            param.selectExpression.addJoinRelation(clone, relations, rel.type);
        }
        return result;
    }
    protected visitFunction<T, TR>(expression: FunctionExpression<T, TR>, param: IVisitParameter) {
        return this.visit(expression.body, param);
    }
    protected visitMember<TType, KProp extends keyof TType>(expression: MemberAccessExpression<TType, KProp>, param: IVisitParameter): IExpression {
        const objectOperand = expression.objectOperand;
        if (expression.memberName === "prototype" || expression.memberName === "__proto__")
            throw new Error(`property ${expression.memberName} not supported in linq to sql.`);

        if (objectOperand instanceof CustomEntityExpression || objectOperand instanceof EntityExpression || objectOperand instanceof ProjectionEntityExpression || objectOperand instanceof EmbeddedColumnExpression) {
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
                    const result = this.visit(computedColumnMeta.functionExpression, { selectExpression: param.selectExpression });
                    if (paramName)
                        this.scopeParameters.remove(paramName);
                    if (result instanceof EntityExpression || result instanceof SelectExpression)
                        throw new Error(`${objectOperand.type.name}.${expression.memberName} not supported`);

                    column = new ComputedColumnExpression(parentEntity, result, expression.memberName as any);
                }
                else if (computedColumnMeta instanceof EmbeddedColumnMetaData) {
                    column = new EmbeddedColumnExpression(parentEntity, computedColumnMeta);
                }
            }
            if (column) {
                if (parentEntity instanceof EmbeddedColumnExpression) {
                    parentEntity.selects.add(column);
                }
                else if (parentEntity.select) {
                    parentEntity.select.selects.add(column);
                }
                return column;
            }
            const relationMeta: RelationMetaData<TType, any> = Reflect.getOwnMetadata(relationMetaKey, objectOperand.type, expression.memberName as string);
            if (relationMeta) {
                const targetType = relationMeta.target.type;
                switch (param.scope) {
                    case "select":
                    case "selectMany":
                        {
                            let child = new SelectExpression(new EntityExpression(targetType, this.newAlias()));
                            if (child.entity.deleteColumn && !(this.options && this.options.includeSoftDeleted)) {
                                child.addWhere(new StrictEqualExpression(child.entity.deleteColumn, new ValueExpression(false)));
                            }
                            if (relationMeta.relationType === "many" && param.scope === "select") {
                                param.selectExpression.itemExpression = child;
                                param.selectExpression.selects = [];
                                param.selectExpression.addInclude("", child, relationMeta);
                                return param.selectExpression;
                            }
                            else {
                                child.addJoinRelation(param.selectExpression, relationMeta.reverseRelation);
                                child.addOrder(param.selectExpression.orders);
                                param.selectExpression = child;
                                return relationMeta.relationType === "many" ? child : child.entity;
                            }
                        }
                    case "project":
                    case "include":
                        {
                            let child = new SelectExpression(new EntityExpression(targetType, this.newAlias()));
                            if (child.entity.deleteColumn && !(this.options && this.options.includeSoftDeleted)) {
                                child.addWhere(new StrictEqualExpression(child.entity.deleteColumn, new ValueExpression(false)));
                            }
                            parentEntity.select!.addInclude(expression.memberName as any, child, relationMeta);
                            return relationMeta.relationType === "many" ? child : child.entity;
                        }
                    default:
                        {
                            let child = new SelectExpression(new EntityExpression(targetType, this.newAlias()));
                            if (child.entity.deleteColumn && !(this.options && this.options.includeSoftDeleted)) {
                                child.addWhere(new StrictEqualExpression(child.entity.deleteColumn, new ValueExpression(false)));
                            }
                            let joinType: JoinType;
                            if (param.scope === "orderBy")
                                joinType = JoinType.LEFT;
                            parentEntity.select!.addJoinRelation(child, relationMeta, joinType);
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
                if ((result as IColumnExpression).entity)
                    return result;
                else if (result instanceof ObjectValueExpression) {
                    return result;
                }
                else if ((result as IEntityExpression).primaryColumns) {
                    switch (param.scope) {
                        case "select":
                        case "selectMany":
                            {
                                let child = new SelectExpression(new EntityExpression(result.type as any, this.newAlias()));
                                if (child.entity.deleteColumn && !(this.options && this.options.includeSoftDeleted)) {
                                    child.addWhere(new StrictEqualExpression(child.entity.deleteColumn, new ValueExpression(false)));
                                }
                                let relation: IExpression<boolean>;
                                for (const childCol of child.entity.primaryColumns) {
                                    const parentCol = param.selectExpression.projectedColumns.first(o => o.columnName === childCol.columnName);
                                    const logicalExp = new StrictEqualExpression(childCol, parentCol);
                                    relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                                }

                                child.addJoinRelation(param.selectExpression, relation, JoinType.INNER);
                                child.addOrder(param.selectExpression.orders);
                                param.selectExpression = child;
                                return child.entity;
                            }
                        default:
                            {
                                return result;
                            }
                    }
                }
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
            const result = objectOperand.object[expression.memberName] as IExpression;
            if ((result as IEntityExpression).primaryColumns) {
                const entityExp = result as IEntityExpression;
                switch (param.scope) {
                    case "selectMany":
                        throw new Error("select many not support select entity");
                    case "select": {
                        let relation: IExpression<boolean>;
                        for (const childCol of entityExp.primaryColumns) {
                            const parentCol = param.selectExpression.projectedColumns.first(o => o.columnName === childCol.columnName);
                            const logicalExp = new StrictEqualExpression(childCol, parentCol);
                            relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                        }
                        entityExp.select.addJoinRelation(param.selectExpression, relation, JoinType.INNER);
                        entityExp.select.addOrder(param.selectExpression.orders);
                        param.selectExpression = entityExp.select;
                        return result;
                    }
                }
            }
            else if (result instanceof SelectExpression) {
                switch (param.scope) {
                    case "select":
                    case "selectMany": {
                        if (result.parentRelation.type === "many" && param.scope === "select") {
                            param.selectExpression.itemExpression = result;
                            param.selectExpression.selects = [];
                            return param.selectExpression;
                        }
                        else {
                            const parentRelation = result.parentRelation as IIncludeRelation;
                            result.parentRelation = null;
                            parentRelation.parent.includes.remove(parentRelation);
                            result.addJoinRelation(param.selectExpression, parentRelation.relations, JoinType.INNER);
                            result.addOrder(param.selectExpression.orders);
                            param.selectExpression = result;
                            return parentRelation.type === "many" ? result : result.entity;
                        }
                    }
                }
            }
            return result;
        }
        else if (objectOperand instanceof EmbeddedColumnExpression) {

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
    protected visitInstantiation<TType>(expression: InstantiationExpression<TType>, param: IVisitParameter): IExpression {
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
    protected visitObjectSelect(selectOperand: SelectExpression, selectExp: ObjectValueExpression<any>, prevPath?: string) {
        let newSelects: IColumnExpression[] = [];
        const joinRelations: Array<IPRelation> = [];
        for (const prop in selectExp.object) {
            const propPath = prevPath ? prevPath + "." + prop : prop;
            const valueExp = selectExp.object[prop];
            if (valueExp instanceof EntityExpression) {
                let childEntity = valueExp as IEntityExpression;
                let parentRel: IJoinRelation<any, any> = childEntity.select.parentRelation as any;

                if (selectOperand instanceof GroupByExpression && childEntity === selectOperand.key) {
                    const replaceMap = new Map();
                    const cloneSelect = childEntity.select.clone();
                    cloneSelect.joins = [];
                    const cloneChildEntity = cloneSelect.entity;
                    for (const col of childEntity.select.projectedColumns) {
                        const cloneCol = cloneChildEntity.columns.first(o => o.columnName === col.columnName);
                        replaceMap.set(col, cloneCol);
                    }
                    for (const col of selectOperand.projectedColumns) {
                        replaceMap.set(col, col);
                    }
                    const relation = (selectOperand.key as IEntityExpression).select.parentRelation.relations.clone(replaceMap);
                    const pr: IPRelation = {
                        name: prop,
                        child: cloneSelect,
                        relations: relation,
                        type: "one"
                    };
                    joinRelations.push(pr);
                }
                else if (childEntity === selectOperand.entity) {
                    let relation: IExpression<boolean>;
                    const cloneSelect = childEntity.select.clone();
                    cloneSelect.joins = [];
                    childEntity = cloneSelect.entity;
                    const l = selectOperand.entity.primaryColumns.length;
                    for (let i = 0; i < l; i++) {
                        const pCol = selectOperand.entity.primaryColumns[i];
                        const cCol = childEntity.primaryColumns[i];
                        const logicalExp = new StrictEqualExpression(pCol, cCol);
                        relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                    }
                    const pr: IPRelation = {
                        name: prop,
                        child: cloneSelect,
                        relations: relation,
                        type: "one"
                    };
                    joinRelations.push(pr);
                }
                else {
                    while ((parentRel as any).name === undefined && parentRel.parent !== selectOperand) {
                        const nextRel = parentRel.parent.parentRelation as IJoinRelation<any, any>;
                        parentRel.parent.joins.remove(parentRel);
                        parentRel.child.addJoinRelation(parentRel.parent, parentRel.relations, JoinType.INNER);
                        if (!parentRel) break;
                        parentRel = nextRel;
                    }
                    selectOperand.joins.remove(parentRel);
                    const pr: IPRelation = {
                        name: prop,
                        child: valueExp.select,
                        relations: parentRel.relations,
                        type: "one"
                    };
                    joinRelations.push(pr);
                }
            }
            // group only
            else if (valueExp instanceof GroupedExpression) {
                let parentRel = valueExp.parentRelation as IJoinRelation<any, any>;
                selectOperand.joins.remove(parentRel);
                const childSelect = valueExp.clone();
                let relation: IExpression<boolean>;
                for (const col of selectOperand.groupBy) {
                    const childCol = childSelect.projectedColumns.first(o => o.columnName === col.columnName);
                    const logicalExp = new StrictEqualExpression(col, childCol);
                    relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                }
                const pr: IPRelation = {
                    name: prop,
                    child: childSelect,
                    relations: relation,
                    type: "many"
                };
                joinRelations.push(pr);
            }
            // non group only
            else if (valueExp instanceof SelectExpression) {
                let parentRel = valueExp.parentRelation as IJoinRelation<any, any>;
                while ((parentRel as any).name === undefined && parentRel.parent !== selectOperand) {
                    const nextRel = parentRel.parent.parentRelation as IJoinRelation<any, any>;
                    parentRel.parent.joins.remove(parentRel);
                    parentRel.child.addJoinRelation(parentRel.parent, parentRel.relations, JoinType.INNER);
                    if (!parentRel) break;
                    parentRel = nextRel;
                }

                selectOperand.joins.remove(parentRel);

                const pr: IPRelation = {
                    name: prop,
                    child: valueExp,
                    relations: parentRel.relations,
                    type: "many"
                };
                joinRelations.push(pr);
            }
            else if (valueExp instanceof ObjectValueExpression) {
                newSelects = newSelects.concat(this.visitObjectSelect(selectOperand, valueExp, propPath));
            }
            else if ((valueExp as IColumnExpression).entity) {
                const columnExp = valueExp as IColumnExpression;
                if (!(selectOperand instanceof GroupByExpression) && valueExp instanceof ComputedColumnExpression) {
                    const column = new ColumnExpression(valueExp.entity, valueExp.type, propPath, valueExp.columnName, valueExp.isPrimary, valueExp.columnType);
                    newSelects.add(column);
                }
                else {
                    columnExp.propertyName = propPath;
                    newSelects.add(columnExp);
                }
            }
            else {
                const column = new ComputedColumnExpression(selectOperand.entity, valueExp, prop);
                column.propertyName = propPath;
                newSelects.add(column);
            }
        }
        for (const rel of joinRelations)
            selectOperand.addInclude(rel.name, rel.child, rel.relations, rel.type);
        return newSelects;
    }
    protected visitObjectGroup(selectOperand: SelectExpression, selectExp: ObjectValueExpression<any>, groupColumns: IColumnExpression[] = [], selectColumns: IColumnExpression[], prevPath: string) {
        const joinRelations: Array<IPRelation> = [];
        for (const prop in selectExp.object) {
            const propPath = prevPath ? prevPath + "." + prop : prop;
            const valueExp = selectExp.object[prop];
            if ((valueExp as IEntityExpression).primaryColumns) {
                const entityExp = valueExp as IEntityExpression;
                // remove relation
                selectOperand.joins.remove(entityExp.select.parentRelation as any);
                visitExpression(entityExp.select.parentRelation.relations, (exp: IExpression): boolean | void => {
                    if ((exp as IColumnExpression).entity && entityExp.select.parentRelation.parent.projectedColumns.contains(exp as any)) {
                        groupColumns.add(exp as any);
                        return false;
                    }
                });
                selectOperand.addInclude(propPath, entityExp.select, entityExp.select.parentRelation.relations, "one");
            }
            else if (valueExp instanceof SelectExpression) {
                throw new Error(`${propPath} Array not supported`);
            }
            else if (valueExp instanceof ObjectValueExpression) {
                this.visitObjectGroup(selectOperand, valueExp, groupColumns, selectColumns, propPath);
            }
            else if ((valueExp as IColumnExpression).entity) {
                const columnExp = valueExp as IColumnExpression;
                columnExp.propertyName = propPath;
                groupColumns.push(columnExp);
                selectColumns.push(columnExp);
            }
            else {
                const col = new ComputedColumnExpression(selectOperand.entity, valueExp, this.newAlias("column"));
                col.propertyName = propPath;
                selectExp.object[prop] = col;
                groupColumns.push(col);
                selectColumns.push(col);
            }
        }
        for (const rel of joinRelations)
            selectOperand.addInclude(rel.name, rel.child, rel.relations, rel.type);
        return selectColumns;
    }
    protected visitMethod<TType, KProp extends keyof TType, TResult = any>(expression: MethodCallExpression<TType, KProp, TResult>, param: IVisitParameter): IExpression {
        const objectOperand = expression.objectOperand;

        if (objectOperand instanceof SelectExpression) {
            let selectOperand = objectOperand as SelectExpression;
            switch (expression.methodName) {
                case "select":
                case "selectMany": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    // clear includes coz select one return selected value without it's relations
                    selectOperand.includes = [];

                    const parentRelation = objectOperand.parentRelation;
                    const selectorFn = (expression.params.length > 1 ? expression.params[1] : expression.params[0]) as FunctionExpression<TType, TResult>;
                    const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: param.scope === "queryable" || param.scope === "select" || param.scope === "selectMany" || objectOperand.isSubSelect ? expression.methodName : "" };
                    this.scopeParameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                    const selectExp = this.visit(selectorFn, visitParam);
                    this.scopeParameters.remove(selectorFn.params[0].name);
                    // TODO recheck
                    selectOperand = param.selectExpression = visitParam.selectExpression;

                    const type = expression.params.length > 1 ? expression.params[0] as ValueExpression<GenericType> : null;

                    if (expression.methodName === "select") {
                        if (selectExp instanceof SelectExpression) {
                            if (selectOperand instanceof GroupByExpression)
                                throw new Error(`groupBy did not support to many select result`);
                            selectOperand = selectExp;
                        }
                        else if ((selectExp as EntityExpression).primaryColumns) {
                            selectOperand = visitParam.selectExpression;
                            if (type) {
                                selectOperand.itemExpression.type = type.value;
                            }
                        }
                        else if (selectExp instanceof ObjectValueExpression) {
                            selectOperand.selects = this.visitObjectSelect(selectOperand, selectExp);
                            selectOperand.itemExpression = selectExp;
                            if (type) {
                                selectOperand.itemExpression.type = type.value;
                            }
                        }
                        else if ((selectExp as IColumnExpression).entity) {
                            const column = selectExp as IColumnExpression;
                            selectOperand.itemExpression = column;
                            selectOperand.selects = [column];
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
                            throw new Error(`Queryable<${objectOperand.type}>.selectMany required selector with array or queryable or enumerable return value.`);
                        }
                        selectOperand = selectExp;
                        if (type) {
                            selectOperand.itemExpression.type = type.value;
                        }
                    }

                    if (parentRelation) {
                        parentRelation.child = selectOperand;
                        selectOperand.parentRelation = parentRelation;
                    }
                    else {
                        param.selectExpression = selectOperand;
                    }

                    return selectOperand;
                }
                case "groupBy": {
                    // TODO: queryable end with group by. Orders.groupBy(o => o.OrderDate).toArray();
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    selectOperand.includes = [];
                    const parentRelation = objectOperand.parentRelation;
                    const selectorFn = expression.params[0] as FunctionExpression<TType, TResult>;
                    const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: expression.methodName };
                    this.scopeParameters.add(selectorFn.params[0].name, selectOperand.getVisitParam());
                    const selectExp = this.visit(selectorFn, visitParam);
                    this.scopeParameters.remove(selectorFn.params[0].name);
                    param.selectExpression = visitParam.selectExpression;

                    if (selectExp instanceof SelectExpression) {
                        throw new Error(`Queryable<${objectOperand.type}>.groupBy did not support selector with array or queryable or enumerable return value.`);
                    }

                    let groupColumns: IColumnExpression[] = [];
                    let key = selectExp;
                    let selectColumns: IColumnExpression[] = [];
                    if ((selectExp as IEntityExpression).primaryColumns) {
                        const entityExp = selectExp as IEntityExpression;
                        visitExpression(entityExp.select.parentRelation.relations, (exp: IExpression): boolean | void => {
                            if ((exp as IColumnExpression).entity && entityExp.select.parentRelation.parent.projectedColumns.contains(exp as any)) {
                                groupColumns.add(exp as any);
                                return false;
                            }
                        });

                        // remove relation
                        entityExp.select.parentRelation.parent.joins.remove(entityExp.select.parentRelation as any);
                        // add include
                        selectOperand.addInclude("key", entityExp.select, entityExp.select.parentRelation.relations, "one");
                    }
                    else if (selectExp instanceof ObjectValueExpression) {
                        this.visitObjectGroup(selectOperand, selectExp, groupColumns, selectColumns, "key");
                    }
                    else if ((selectExp as IColumnExpression).entity) {
                        const column = (selectExp as IColumnExpression).clone();
                        column.propertyName = "key";
                        groupColumns.push(column);
                        selectColumns.push(column);
                        key = column;
                    }
                    else {
                        const column = new ComputedColumnExpression(selectOperand.entity, selectExp, "key");
                        groupColumns.push(column);
                        selectColumns.push(column);
                        key = column;
                    }

                    const groupByExp = new GroupByExpression(selectOperand, groupColumns, key, true);
                    groupByExp.selects = selectColumns.slice(0);
                    if (parentRelation) {
                        parentRelation.child = groupByExp;
                        groupByExp.parentRelation = parentRelation;
                    }
                    else {
                        param.selectExpression = groupByExp;
                    }
                    
                    return groupByExp;
                }
                case "project":
                case "include": {
                    if (expression.methodName === "project") {
                        objectOperand.selects = [];
                    }
                    for (const paramFn of expression.params) {
                        const selectorFn = paramFn as FunctionExpression<TType, TResult>;
                        this.scopeParameters.add(selectorFn.params[0].name, objectOperand.getVisitParam());
                        let visitParam: IVisitParameter = { selectExpression: objectOperand, scope: expression.methodName };
                        this.visit(selectorFn, visitParam);
                        this.scopeParameters.remove(selectorFn.params[0].name);
                    }
                    return objectOperand;
                }
                case "where": {
                    if (selectOperand instanceof GroupedExpression) {
                        const clone = selectOperand.clone();
                        clone.entity.alias = this.newAlias();
                        clone.where = null;
                        clone.joins = [];
                        let relation: IExpression<boolean>;
                        for (const parentCol of selectOperand.entity.primaryColumns) {
                            const childCol = clone.entity.columns.first(o => o.columnName === parentCol.columnName);
                            const logicalExp = new StrictEqualExpression(parentCol, childCol);
                            relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
                        }
                        param.selectExpression.addJoinRelation(clone, relation, JoinType.LEFT);
                        selectOperand = clone;
                    }

                    const predicateFn = expression.params[0] as FunctionExpression<TType, boolean>;
                    const visitParam: IVisitParameter = { selectExpression: selectOperand, scope: "where" };
                    this.scopeParameters.add(predicateFn.params[0].name, selectOperand.getVisitParam());
                    const whereExp = this.visit(predicateFn, visitParam) as IExpression<boolean>;
                    this.scopeParameters.remove(predicateFn.params[0].name);

                    if (whereExp.type !== Boolean) {
                        throw new Error(`Queryable<${objectOperand.type}>.where required predicate with boolean return value.`);
                    }

                    selectOperand.addWhere(whereExp);
                    return selectOperand;
                }
                case "contains": {
                    // TODO: dbset1.where(o => dbset2.select(c => c.column).contains(o.column)); use inner join for this
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    const isSubSelect = objectOperand.isSubSelect;
                    let item = expression.params[0];
                    if (isSubSelect)
                        item = this.visit(item, param);

                    let andExp: IExpression<boolean>;
                    if (isSubSelect) {
                        objectOperand.isAggregate = true;
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
                    if (param.scope === "queryable" || isSubSelect) {
                        objectOperand.addWhere(andExp);
                        const column = new ComputedColumnExpression(objectOperand.entity, new ValueExpression(true), this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.paging.take = new ValueExpression(1);
                        objectOperand.isAggregate = true;
                        return isSubSelect ? new EqualExpression(objectOperand, new ValueExpression(1)) : objectOperand;
                    }
                    return andExp;
                }
                case "distinct": {
                    if (param.scope === "include" || param.scope === "project")
                        throw new Error(`${param.scope} did not support ${expression.methodName}`);

                    objectOperand.distinct = true;
                    objectOperand.isAggregate = param.scope === "queryable" || objectOperand.isSubSelect;
                    return objectOperand;
                }
                case "orderBy": {
                    const selectors = expression.params as ArrayValueExpression[];
                    const orders: IOrderExpression[] = [];
                    for (const selector of selectors) {
                        const selectorFn = selector.items[0] as FunctionExpression<TType, any>;
                        const direction = selector.items[1] ? selector.items[1] as ValueExpression<OrderDirection> : new ValueExpression<OrderDirection>("ASC");
                        const visitParam: IVisitParameter = { selectExpression: objectOperand, scope: expression.methodName };
                        this.scopeParameters.add(selectorFn.params[0].name, objectOperand.getVisitParam());
                        const selectExp = this.visit(selectorFn, visitParam) as IColumnExpression;
                        this.scopeParameters.remove(selectorFn.params[0].name);

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

                    if (param.scope !== "queryable") {
                        // has take/skip
                        let takeJoinRel = objectOperand.joins.first(o => o.name === "TAKE");
                        if (takeJoinRel) {
                            const orderJoinRel = takeJoinRel.child.joins[takeJoinRel.child.joins.length - 1];

                            let orderExp: IExpression<boolean>;
                            for (let i = 0; i < objectOperand.entity.primaryColumns.length; i++) {
                                const sortCol = orderJoinRel.child.entity.primaryColumns[i];
                                const filterCol = takeJoinRel.child.entity.primaryColumns[i];
                                const orderCompExp = new GreaterEqualExpression(sortCol, filterCol);
                                if (orderExp) {
                                    orderExp = new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp));
                                }
                                else {
                                    orderExp = orderCompExp;
                                }
                            }

                            // clone to support complex orderBy
                            const sortMap = new Map();
                            const filterMap = new Map();
                            objectOperand.entity.columns.each(o => {
                                sortMap.set(o, orderJoinRel.child.entity.columns.first(c => c.propertyName === o.propertyName));
                                filterMap.set(o, takeJoinRel.child.entity.columns.first(c => c.propertyName === o.propertyName));
                            });
                            for (let i = 0; i < objectOperand.orders.length; i++) {
                                const order = objectOperand.orders[i];
                                const sortCol = sortMap.has(order.column) ? sortMap.get(order.column) : order.column.clone(sortMap);
                                const filterCol = filterMap.has(order.column) ? filterMap.get(order.column) : order.column.clone(filterMap);
                                const orderCompExp = new (order.direction === "DESC" ? LessThanExpression : GreaterThanExpression)(sortCol, filterCol);
                                orderExp = new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp));
                            }

                            // replace to new order
                            const oriOrderExp = (takeJoinRel as any).order;
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
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(objectOperand.entity, countExp, this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.itemExpression = column;
                        objectOperand.isAggregate = true;
                        return objectOperand;
                    }
                    else if (selectOperand instanceof GroupedExpression) {
                        // don't select unnecessary column
                        if (param.scope && param.scope.indexOf("select") === 0) {
                            selectOperand.selects = [];
                            selectOperand.relationColumns = selectOperand.relationColumns.skip(selectOperand.select.groupBy.length).toArray();
                        }
                        return countExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const groupBy: IColumnExpression[] = [];
                        const keyObject: any = {};
                        if (!selectOperand.parentRelation.relations) {
                            selectOperand.parentRelation.relations = new StrictEqualExpression(new ValueExpression(true), new ValueExpression(true));
                        }
                        visitExpression(selectOperand.parentRelation.relations, (exp: IExpression): boolean | void => {
                            if ((exp as IColumnExpression).entity && selectOperand.projectedColumns.contains(exp as any)) {
                                const colExp = exp as IColumnExpression;
                                groupBy.push(colExp);
                                keyObject[colExp.propertyName] = colExp;
                                return false;
                            }
                        });

                        const groupExp = new GroupByExpression(selectOperand, groupBy, new ObjectValueExpression(keyObject));
                        const column = new ComputedColumnExpression(objectOperand.entity, countExp, this.newAlias("column"));
                        groupExp.selects.push(column);

                        if (objectOperand.isSubSelect) {
                            // create another join to bridge this and parent.
                            const parentSelect = selectOperand.parentRelation.parent;
                            const bridge = new SelectExpression(parentSelect.entity.clone());
                            if (bridge.entity.deleteColumn && !(this.options && this.options.includeSoftDeleted)) {
                                bridge.addWhere(new StrictEqualExpression(bridge.entity.deleteColumn, new ValueExpression(false)));
                            }
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
                            bridge.addJoinRelation(groupExp, bridgeCurRelation, selectOperand.parentRelation.type as any);

                            // group the bridge so it could be easily join to parent
                            const bridgeAggreateExp = new MethodCallExpression(bridge, "sum", [column], Number);
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            const groupBys = bridge.projectedColumns.toArray();
                            const groupedBridge = new GroupByExpression(bridge, groupBys, groupExp.key);

                            // add join from parent to bridge
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                const pCol = parentSelect.projectedColumns.first(o => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }
                            parentSelect.addJoinRelation(groupedBridge, bridgeParentRelation, JoinType.LEFT);
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
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(selectOperand.entity, aggregateExp, this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.isAggregate = true;
                        return objectOperand;
                    }
                    else if (selectOperand instanceof GroupedExpression) {
                        return aggregateExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const groupBy: IColumnExpression[] = [];
                        const keyObject: any = {};
                        if (!selectOperand.parentRelation.relations) {
                            selectOperand.parentRelation.relations = new StrictEqualExpression(new ValueExpression(true), new ValueExpression(true));
                        }

                        visitExpression(selectOperand.parentRelation.relations, (exp: IExpression): boolean | void => {
                            if ((exp as IColumnExpression).entity && selectOperand.projectedColumns.contains(exp as any)) {
                                const colExp = exp as IColumnExpression;
                                groupBy.add(colExp);
                                keyObject[colExp.propertyName] = colExp;
                                return false;
                            }
                        });
                        const groupExp = new GroupByExpression(selectOperand, groupBy, new ObjectValueExpression(keyObject));
                        const column = new ComputedColumnExpression(selectOperand.entity, aggregateExp, this.newAlias("column"));
                        groupExp.selects.push(column);

                        if (objectOperand.isSubSelect) {
                            // create another join to bridge this and parent.
                            const parentSelect = selectOperand.parentRelation.parent;
                            const bridge = new SelectExpression(parentSelect.entity.clone());
                            if (bridge.entity.deleteColumn && !(this.options && this.options.includeSoftDeleted)) {
                                bridge.addWhere(new StrictEqualExpression(bridge.entity.deleteColumn, new ValueExpression(false)));
                            }
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
                            bridge.addJoinRelation(groupExp, bridgeCurRelation, selectOperand.parentRelation.type as any);

                            // group the bridge so it could be easily join to parent
                            const bridgeAggreateExp = new MethodCallExpression(bridge, expression.methodName, [column], Number);
                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            const groupBys = bridge.projectedColumns.toArray();
                            const groupedBridge = new GroupByExpression(bridge, groupBys, groupExp.key);

                            // add join from parent to bridge
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                const pCol = parentSelect.projectedColumns.first(o => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }
                            parentSelect.addJoinRelation(groupedBridge, bridgeParentRelation, JoinType.LEFT);
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
                    if (param.scope === "queryable") {
                        // call from queryable
                        const column = new ComputedColumnExpression(objectOperand.entity, anyExp, this.newAlias("column"));
                        objectOperand.selects = [column];
                        objectOperand.paging.take = new ValueExpression(1);
                        objectOperand.isAggregate = true;
                        return objectOperand;
                    }
                    else if (selectOperand instanceof GroupedExpression) {
                        // don't select unnecessary column
                        if (param.scope && param.scope.indexOf("select") === 0) {
                            selectOperand.selects = [];
                            selectOperand.relationColumns = selectOperand.relationColumns.skip(selectOperand.select.groupBy.length).toArray();
                        }
                        return anyExp;
                    }
                    else {
                        // any is used on related entity. change query to groupby.
                        const groupBy: IColumnExpression[] = [];
                        const keyObject: any = {};
                        if (!selectOperand.parentRelation.relations) {
                            selectOperand.parentRelation.relations = new StrictEqualExpression(new ValueExpression(true), new ValueExpression(true));
                        }

                        visitExpression(selectOperand.parentRelation.relations, (exp: IExpression): boolean | void => {
                            if ((exp as IColumnExpression).entity && selectOperand.projectedColumns.contains(exp as any)) {
                                const colExp = exp as IColumnExpression;
                                groupBy.add(colExp);
                                keyObject[colExp.propertyName] = colExp;
                                return false;
                            }
                        });
                        const groupExp = new GroupByExpression(selectOperand, groupBy, new ObjectValueExpression(keyObject));
                        const column = new ComputedColumnExpression(objectOperand.entity, anyExp, this.newAlias("column"));
                        groupExp.selects.push(column);

                        if (objectOperand.isSubSelect) {
                            // create another join to bridge this and parent.
                            const parentSelect = selectOperand.parentRelation.parent;
                            const bridge = new SelectExpression(parentSelect.entity.clone());
                            if (bridge.entity.deleteColumn && !(this.options && this.options.includeSoftDeleted)) {
                                bridge.addWhere(new StrictEqualExpression(bridge.entity.deleteColumn, new ValueExpression(false)));
                            }
                            bridge.entity.alias = this.newAlias();
                            bridge.selects = [];
                            bridge.joins = [];
                            bridge.includes = [];

                            // remove relation from current to parent
                            parentSelect.joins.remove(selectOperand.parentRelation as any);

                            // add relation from bridge to current
                            const replaceMap = new Map();
                            for (const col of parentSelect.entity.columns) {
                                const cloneCol = bridge.entity.columns.first(o => o.columnName === col.columnName);
                                replaceMap.set(col, cloneCol);
                            }
                            for (const col of groupExp.projectedColumns) {
                                replaceMap.set(col, col);
                            }
                            let bridgeCurRelation = selectOperand.parentRelation.relations.clone(replaceMap);
                            if (!isAny) {
                                bridgeCurRelation = new NotExpression(bridgeCurRelation);
                            }
                            bridge.addJoinRelation(groupExp, bridgeCurRelation, selectOperand.parentRelation.type as any);

                            // group the bridge so it could be easily join to parent
                            let bridgeAggreateExp: IExpression<boolean>;
                            if (isAny) {
                                bridgeAggreateExp = new StrictNotEqualExpression(new MethodCallExpression(bridge, "sum", [column], Number), new ValueExpression(null));
                            }
                            else {
                                bridgeAggreateExp = new StrictEqualExpression(new MethodCallExpression(bridge, "sum", [column], Number), new ValueExpression(null));
                            }

                            const bridgeColumn = new ComputedColumnExpression(bridge.entity, bridgeAggreateExp, this.newAlias("column"));
                            const groupBys = bridge.projectedColumns.toArray();
                            const groupedBridge = new GroupByExpression(bridge, groupBys, groupExp.key);

                            // add join from parent to bridge
                            let bridgeParentRelation: IExpression<boolean>;
                            for (const primaryCol of bridge.entity.primaryColumns) {
                                const pCol = parentSelect.projectedColumns.first(o => o.columnName === primaryCol.columnName);
                                const logicalExp = new StrictEqualExpression(primaryCol, pCol);
                                bridgeParentRelation = bridgeParentRelation ? new AndExpression(bridgeParentRelation, logicalExp) : logicalExp;
                            }
                            parentSelect.addJoinRelation(groupedBridge, bridgeParentRelation, JoinType.LEFT);
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
                        const filterer = (objectOperand as SelectExpression).clone();
                        filterer.entity.alias = this.newAlias();
                        filterer.includes = [];
                        const sorter = (objectOperand as SelectExpression).clone();
                        sorter.entity.alias = this.newAlias();
                        sorter.includes = [];

                        // column used for parent relations.
                        const relationColumns: IColumnExpression[] = [];
                        visitExpression(objectOperand.parentRelation.relations, (exp: IColumnExpression): boolean | void => {
                            if (exp.entity && objectOperand.entity.columns.contains(exp)) {
                                relationColumns.push(exp);
                                return false;
                            }
                        });

                        let joinExp: IExpression<boolean>;
                        relationColumns.each(o => {
                            const sortCol = sorter.entity.columns.first(col => col.propertyName === o.propertyName);
                            const filterCol = filterer.entity.columns.first(col => col.propertyName === o.propertyName);
                            const logicalExp = new StrictEqualExpression(sortCol, filterCol);
                            joinExp = joinExp ? new AndExpression(joinExp, logicalExp) : logicalExp;
                        });
                        let orderExp: IExpression<boolean>;
                        for (let i = 0; i < objectOperand.entity.primaryColumns.length; i++) {
                            const sortCol = sorter.entity.primaryColumns[i];
                            const filterCol = filterer.entity.primaryColumns[i];
                            const orderCompExp = new GreaterEqualExpression(sortCol, filterCol);
                            if (orderExp) {
                                orderExp = new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp));
                            }
                            else {
                                orderExp = orderCompExp;
                            }
                        }
                        for (let i = 0; i < objectOperand.orders.length; i++) {
                            const order = objectOperand.orders[i];
                            const sortCol = sorter.orders[i].column;
                            const filterCol = filterer.orders[i].column;
                            const orderCompExp = new (order.direction === "DESC" ? LessThanExpression : GreaterThanExpression)(sortCol, filterCol);
                            orderExp = new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp));
                        }
                        sorter.orders = filterer.orders = [];
                        filterer.addJoinRelation(sorter, new AndExpression(joinExp, orderExp), JoinType.INNER);

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
                        const groupExp = new GroupByExpression(filterer, filterer.entity.primaryColumns, keyExp);
                        groupExp.selects = [colCountExp];

                        // add join relation to current object operand
                        let joinRelation: IExpression<boolean>;
                        for (let i = 0; i < objectOperand.entity.primaryColumns.length; i++) {
                            const objCol = objectOperand.entity.primaryColumns[i];
                            const groupCol = groupExp.entity.primaryColumns[i];
                            const logicalExp = new StrictEqualExpression(objCol, groupCol);
                            joinRelation = joinRelation ? new AndExpression(joinRelation, logicalExp) : logicalExp;
                        }

                        objectOperand.addJoinRelation(groupExp, joinRelation, JoinType.INNER);
                        groupExp.having = new LessEqualExpression(countExp, new ValueExpression(1));
                    }
                    return selectOperand.entity;
                }
                case "skip":
                case "take": {
                    let exp = this.visit(expression.params[0] as ParameterExpression<number>, param);
                    if (param.scope === "queryable") {
                        if (expression.methodName === "skip") {
                            if (objectOperand.paging.take) {
                                objectOperand.paging.take = this.visit(new SubtractionExpression(objectOperand.paging.take, exp), param);
                                exp = this.visit(expression.params[0] as ParameterExpression<number>, param);
                            }
                            objectOperand.paging.skip = this.visit(objectOperand.paging.skip ? new AdditionExpression(objectOperand.paging.skip, exp) : exp, param);
                        }
                        else {
                            objectOperand.paging.take = this.visit(objectOperand.paging.take ? new MethodCallExpression(new ValueExpression(Math), "min", [objectOperand.paging.take, exp]) : exp, param);
                        }
                    }
                    else {
                        let takeJoinRel = objectOperand.joins.first(o => o.name === "TAKE");
                        if (!takeJoinRel) {
                            const filterer = (objectOperand as SelectExpression).clone();
                            filterer.entity.alias = this.newAlias();
                            filterer.includes = [];
                            const sorter = (objectOperand as SelectExpression).clone();
                            sorter.entity.alias = this.newAlias();
                            sorter.includes = [];

                            // column used for parent relations.
                            const relationColumns: IColumnExpression[] = [];
                            visitExpression(objectOperand.parentRelation.relations, (exp: IColumnExpression): boolean | void => {
                                if (exp.entity && objectOperand.entity.columns.contains(exp)) {
                                    relationColumns.push(exp);
                                    return false;
                                }
                            });

                            let joinExp: IExpression<boolean>;
                            relationColumns.each(o => {
                                const sortCol = sorter.entity.columns.first(col => col.propertyName === o.propertyName);
                                const filterCol = filterer.entity.columns.first(col => col.propertyName === o.propertyName);
                                const logicalExp = new StrictEqualExpression(sortCol, filterCol);
                                joinExp = joinExp ? new AndExpression(joinExp, logicalExp) : logicalExp;
                            });
                            let orderExp: IExpression<boolean>;
                            for (let i = 0; i < objectOperand.entity.primaryColumns.length; i++) {
                                const sortCol = sorter.entity.primaryColumns[i];
                                const filterCol = filterer.entity.primaryColumns[i];
                                const orderCompExp = new GreaterEqualExpression(sortCol, filterCol);
                                if (orderExp) {
                                    orderExp = new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp));
                                }
                                else {
                                    orderExp = orderCompExp;
                                }
                            }
                            for (let i = 0; i < objectOperand.orders.length; i++) {
                                const order = objectOperand.orders[i];
                                const sortCol = sorter.orders[i].column;
                                const filterCol = filterer.orders[i].column;
                                const orderCompExp = new (order.direction === "DESC" ? LessThanExpression : GreaterThanExpression)(sortCol, filterCol);
                                orderExp = new OrExpression(orderCompExp, new AndExpression(new StrictEqualExpression(sortCol, filterCol), orderExp));
                            }
                            sorter.orders = filterer.orders = [];
                            filterer.addJoinRelation(sorter, new AndExpression(joinExp, orderExp), JoinType.INNER);

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
                            const groupExp = new GroupByExpression(filterer, filterer.entity.primaryColumns, keyExp);
                            groupExp.selects = [colCountExp];

                            // add join relation to current object operand
                            let joinRelation: IExpression<boolean>;
                            for (let i = 0; i < objectOperand.entity.primaryColumns.length; i++) {
                                const objCol = objectOperand.entity.primaryColumns[i];
                                const groupCol = groupExp.entity.primaryColumns[i];
                                const logicalExp = new StrictEqualExpression(objCol, groupCol);
                                joinRelation = joinRelation ? new AndExpression(joinRelation, logicalExp) : logicalExp;
                            }

                            takeJoinRel = objectOperand.addJoinRelation(groupExp, joinRelation, JoinType.INNER);
                            takeJoinRel.name = "TAKE";
                            (takeJoinRel as any).order = orderExp;
                        }

                        const groupExp = takeJoinRel.child as GroupByExpression;
                        const anyTakeJoinRel = takeJoinRel as any;
                        const countExp = (groupExp.selects.first() as ComputedColumnExpression).expression;

                        if (expression.methodName === "skip") {
                            anyTakeJoinRel.start = this.visit(anyTakeJoinRel.start ? new AdditionExpression(anyTakeJoinRel.start, exp) : exp, param);
                        }
                        else {
                            anyTakeJoinRel.end = this.visit(anyTakeJoinRel.start ? new AdditionExpression(anyTakeJoinRel.start, exp) : exp, param);
                        }

                        groupExp.having = null;
                        if (anyTakeJoinRel.start) {
                            groupExp.having = new GreaterThanExpression(countExp, anyTakeJoinRel.start);
                        }
                        if (anyTakeJoinRel.end) {
                            const takeLogicalExp = new LessEqualExpression(countExp, anyTakeJoinRel.end);
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
                    if (selectOperand.entity.deleteColumn && !(this.options && this.options.includeSoftDeleted)) {
                        selectOperand.addWhere(new StrictEqualExpression(selectOperand.entity.deleteColumn, new ValueExpression(false)));
                    }
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

                    if (expression.methodName === "groupJoin") {
                        childSelectOperand.parentRelation = {
                            child: childSelectOperand,
                            parent: selectOperand,
                            relations: relation,
                            type: jointType
                        };
                    }
                    else {
                        selectOperand.addJoinRelation(childSelectOperand, relation, jointType);
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

                    const dimensions = expression.params[0] as FunctionExpression<TType, any>;
                    const metrics = expression.params[1] as FunctionExpression<TType, any>;

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
        const objectValue: any = {};
        for (const prop in expression.object) {
            objectValue[prop] = this.visit(expression.object[prop], { selectExpression: param.selectExpression, scope: param.scope + "-object" });
        }
        expression.object = objectValue;
        return expression;
    }

    //#endregion
}
