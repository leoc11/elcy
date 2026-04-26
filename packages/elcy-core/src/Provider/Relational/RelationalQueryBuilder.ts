import { QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType, MethodKey, MethodReturnType, SetterObj, StringKeyOf, ValueType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { Enumerable, IEnumerable, IObjectType } from "@elcy/enumerable";
import { AndExpression } from "../../ExpressionBuilder/Expression/AndExpression";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import { EqualExpression } from "../../ExpressionBuilder/Expression/EqualExpression";
import { FunctionCallExpression } from "../../ExpressionBuilder/Expression/FunctionCallExpression";
import { IBinaryOperatorExpression } from "../../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { InstantiationExpression } from "../../ExpressionBuilder/Expression/InstantiationExpression";
import { IUnaryOperatorExpression } from "../../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { MemberAccessExpression } from "../../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ObjectValueExpression } from "../../ExpressionBuilder/Expression/ObjectValueExpression";
import { ParameterExpression } from "../../ExpressionBuilder/Expression/ParameterExpression";
import { StrictEqualExpression } from "../../ExpressionBuilder/Expression/StrictEqualExpression";
import { TernaryExpression } from "../../ExpressionBuilder/Expression/TernaryExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { ExpressionExecutor } from "../../ExpressionBuilder/ExpressionExecutor";
import { isColumnExp, isEntityExp, isNotNull, isNull, mapReplaceExp } from "../../Helper/Util";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { BatchedQuery } from "../../Query/BatchedQuery";
import { DbFunction } from "../../Query/DbFunction";
import { IQuery } from "../../Query/IQuery";
import { IQueryBuilder } from "../../Query/IQueryBuilder";
import { IQueryBuilderContext } from "../../Query/IQueryBuilderContext";
import { IQueryOption } from "../../Query/IQueryOption";
import { ISqlParameterValueMap } from "../../Query/IQueryParameter";
import { IQueryTranslatorItem } from "../../Query/IQueryTranslatorItem";
import { AliasType, NamingStrategy } from "../../Query/NamingStrategy";
import { HavingJoinRelation } from "../../Queryable/Interface/HavingJoinRelation";
import { IncludeRelation } from "../../Queryable/Interface/IncludeRelation";
import { ISelectRelation } from "../../Queryable/Interface/ISelectRelation";
import { JoinRelation } from "../../Queryable/Interface/JoinRelation";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { ComputedColumnExpression } from "../../Queryable/QueryExpression/ComputedColumnExpression";
import { DeleteExpression } from "../../Queryable/QueryExpression/DeleteExpression";
import { ExceptExpression } from "../../Queryable/QueryExpression/ExceptExpression";
import { GroupByExpression } from "../../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../../Queryable/QueryExpression/IColumnExpression";
import { IEntityExpression } from "../../Queryable/QueryExpression/IEntityExpression";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { InsertIntoExpression } from "../../Queryable/QueryExpression/InsertIntoExpression";
import { IntersectExpression } from "../../Queryable/QueryExpression/IntersectExpression";
import { IQueryExpression } from "../../Queryable/QueryExpression/IQueryExpression";
import { ProjectionEntityExpression } from "../../Queryable/QueryExpression/ProjectionEntityExpression";
import { RawSqlExpression } from "../../Queryable/QueryExpression/RawSqlExpression";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../../Queryable/QueryExpression/SqlParameterExpression";
import { SqlTableValueParameterExpression, TSchema } from "../../Queryable/QueryExpression/SqlTableValueParameterExpression";
import { UnionExpression } from "../../Queryable/QueryExpression/UnionExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { relationalQueryTranslator } from "./RelationalQueryTranslator";
import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { RawEntityExpression } from "src/Queryable/QueryExpression/RawEntityExpression";
import { ConcatExpression } from "src/Queryable/QueryExpression/ConcatExpression";
import { IQueryIncludeRelation } from "src/Queryable/QueryExpression/IQueryIncludeRelation";
import { IMultiOperatorExpression } from "src/ExpressionBuilder/Expression/IMultiOperatorExpression";
import { Null } from "src/Common/Constant";

export abstract class RelationalQueryBuilder implements IQueryBuilder {
    public get lastInsertIdQuery() {
        if (!this._lastInsertedIdQuery) {
            this._lastInsertedIdQuery = this.toString(ExpressionBuilder.parse(() => DbFunction.lastInsertedId()).body);
        }
        return this._lastInsertedIdQuery;
    }
    public namingStrategy: NamingStrategy;
    public abstract queryLimit: IQueryLimit;
    public translator = relationalQueryTranslator;

    //#region Formatting
    protected indent = 0;
    private _lastInsertedIdQuery: string;
    private aliasObj: { [key: string]: number } = {};
    public columnTypeString(columnType: ICompleteColumnType): string {
        let type = columnType.columnType;
        if (columnType.option) {
            const option = columnType.option;
            if (isNotNull(option.length) || isNotNull(option.size)) {
                type += `(${option.length || option.size})`;
            }
            else if (isNotNull(option.precision)) {
                type += isNotNull(option.scale) ? `(${option.precision}, ${option.scale})` : `(${option.precision})`;
            }
        }
        return type;
    }
    public enclose(identity: string) {
        let requireEscape = this.namingStrategy.enableEscape;
        if (!requireEscape) {
            requireEscape = identity.search(/[ ]/) !== -1;
        }
        if (requireEscape) {
            return this.encloseIdentifier(identity);
        }

        return identity;
    }
    public encloseIdentifier(identity: string) {
        return `"${identity}"`;
    }
    //#endregion

    public mergeQueries(queries: IEnumerable<IQuery>): IQuery[] {
        const result: IQuery[] = [];
        let batch: BatchedQuery = null;
        let paramCount = 0;
        let queryLength = 0;
        let prev: IQuery;
        for (const o of queries) {
            if (!prev && !batch) {
                prev = o;
                continue;
            }

            let isLimitExceed = true;
            if (batch) {
                const qParamCount = o.parameters ? o.parameters.size : 0;
                isLimitExceed = this.queryLimit.maxBatchQuery && batch.queryCount >= this.queryLimit.maxBatchQuery
                    || this.queryLimit.maxQueryLength && (queryLength + o.query.length + 3) > this.queryLimit.maxQueryLength
                    || this.queryLimit.maxParameters && paramCount + qParamCount > this.queryLimit.maxParameters;
                if (!isLimitExceed) {
                    paramCount += qParamCount;
                    queryLength += o.query.length + 3;
                }
            }
            else {
                const newQueryLength = (o.query.length + prev.query.length + 3);
                const newParamSize = (o.parameters?.size ?? 0) + (prev.parameters?.size ?? 0);
                isLimitExceed = this.queryLimit.maxBatchQuery && 2 >= this.queryLimit.maxBatchQuery
                    || this.queryLimit.maxQueryLength && newQueryLength > this.queryLimit.maxQueryLength
                    || this.queryLimit.maxParameters && newParamSize > this.queryLimit.maxParameters;

                if (!isLimitExceed) {
                    batch = new BatchedQuery();
                    batch.add(prev);
                    prev = undefined;
                    paramCount = newParamSize;
                    queryLength = newQueryLength;
                    result.push(batch);
                }
            }

            if (!isLimitExceed) {
                batch.add(o);
            }
            else {
                if (prev) {
                    result.push(prev);
                }
                prev = o;
                batch = undefined;
            }
        }

        if (prev) {
            result.push(prev);
        }

        return result;
    }
    public newAlias(type: AliasType = "entity") {
        if (!this.aliasObj[type]) {
            this.aliasObj[type] = 0;
        }
        return this.namingStrategy.getAlias(type) + this.aliasObj[type]++;
    }
    public newLine(indent = 0, isAdd = true) {
        indent += this.indent;
        if (isAdd) {
            this.indent = indent;
        }
        return "\n" + (Array(indent + 1).join("\t"));
    }

    public resolveTranslator<T = any>(object: T, memberName?: StringKeyOf<T>) {
        return this.translator.resolve(object, memberName);
    }
    public toLogicalString(expression: IExpression<boolean>, context?: IQueryBuilderContext) {
        if (isColumnExp(expression)) {
            expression = new EqualExpression(expression, new ValueExpression(true));
        }
        return this.toString(expression, context);
    }
    public toOperandString(expression: IExpression, context?: IQueryBuilderContext): string {
        return this.toString(expression, context);
    }
    //#endregion

    //#region Value Convert

    public persistValue(value: any, column?: IColumnMetaData): any {
        if (typeof value === "number" && !Number.isFinite(value)) {
            value = null;
        }

        if (column?.nullable !== false && isNull(value)) {
            return null;
        }

        const columnConfig = this.translator.resolveColumnType(column?.constructor as IObjectType<IColumnMetaData>);
        if (columnConfig) {
            return columnConfig.persist(value, column, this.translator);
        }

        const valueConfig = this.translator.resolveValueType(column?.type ?? value?.constructor ?? Null);
        return valueConfig.persist(value);
    }

    public hydrateValue<T>(value: any, column: IColumnMetaData<any, T>): T {
        if (typeof value === "number" && !Number.isFinite(value)) {
            value = null;
        }
        if (column.nullable && isNull(value)) {
            return null;
        }

        const columnConfig = this.translator.resolveColumnType<T>(column.constructor as IObjectType<IColumnMetaData<any, T>>);
        if (columnConfig) {
            return columnConfig.hydrate(value, column, this.translator);
        }

        const valueConfig = this.translator.resolveValueType(column.type as GenericType<Extract<T, ValueType>>);
        if (!valueConfig) {
            throw new Error(`${column.type.name} not supported`);
        }

        return valueConfig.hydrate(value);
    }

    //#region Query
    public toQuery<T>(queryExpression: IQueryExpression<T>, parameters?: ISqlParameterValueMap, option?: IQueryOption): IQuery[] {
        if (queryExpression instanceof SelectExpression) {
            return this.getSelectQuery(queryExpression, option, parameters);
        }
        if (queryExpression instanceof InsertIntoExpression) {
            return this.getInsertIntoQuery(queryExpression, option, parameters);
        }
        if (queryExpression instanceof InsertExpression) {
            return this.getInsertQuery(queryExpression, option, parameters);
        }
        if (queryExpression instanceof UpdateExpression) {
            return this.getUpdateQuery(queryExpression, option, parameters);
        }
        if (queryExpression instanceof UpsertExpression) {
            return this.getUpsertQuery(queryExpression, option, parameters);
        }
        if (queryExpression instanceof DeleteExpression) {
            return this.getDeleteQuery(queryExpression, option, parameters);
        }

        return [];
    }
    public toString<T = any>(expression: IExpression<T>, context?: IQueryBuilderContext): string {
        switch (true) {
            case expression instanceof MemberAccessExpression:
                return this.toMemberAccessString(expression, context);
            case expression instanceof MethodCallExpression:
                return this.toMethodCallString(expression, context);
            case expression instanceof FunctionCallExpression:
                return this.toFunctionCallString(expression, context);
            case expression instanceof SqlParameterExpression:
                return this.toSqlParameterString(expression, context);
            case expression instanceof ArrayValueExpression:
                return this.toArrayString(expression, context);
            case expression instanceof ValueExpression:
                return this.toValueString(expression, context);
            case expression instanceof InstantiationExpression:
                return this.toInstantiationString(expression, context);
            case expression instanceof RawSqlExpression:
                return this.toRawSqlString(expression, context);
            case expression instanceof SelectExpression:
                return this.toSelectString(expression, context);
            default: {
                if (isColumnExp(expression)) {
                    return this.getColumnQueryString(expression, context);
                }
                else if (isEntityExp(expression)) {
                    return this.toEntityString(expression);
                }
                else if (expression instanceof TernaryExpression) {
                    return this.toOperatorString(expression as any, context);
                }
                else if ((expression as IBinaryOperatorExpression).rightOperand) {
                    return `(${this.toOperatorString(expression as any, context)})`;
                }
                else if ((expression as IUnaryOperatorExpression).operand) {
                    return this.toOperatorString(expression as any, context);
                }
                else if ((expression as IMultiOperatorExpression).operands) {
                    return `(${this.toOperatorString(expression as any, context)})`;
                }
            }
        }

        throw new Error(`Expression ${expression.toString()} not supported`);
    }
    //#endregion

    //#region Value
    public valueString<T extends ValueType>(value: T): string {
        const type = (isNull(value) || (typeof value === "number" && !Number.isFinite(value))
            ? Null : value.constructor) as GenericType<T>;

        const valueTypeConfig = this.translator.resolveValueType(type);
        if (!valueTypeConfig) {
            throw new Error(`type "${type.name}" not supported`);
        }

        return valueTypeConfig.toQueryValue(value);
    }

    //#endregion

    //#region refactor
    public extractValue<T>(exp: IExpression<T>, context?: IQueryBuilderContext): T | undefined {
        if (exp instanceof ValueExpression) {
            return exp.value;
        }
        else if (exp instanceof SqlParameterExpression) {
            const takeParam = context.parameters.get(exp);
            if (takeParam) {
                return takeParam.value as T;
            }
        }
        return undefined;
    }
    protected getColumnQueryString<TE extends object>(column: IColumnExpression<TE>, context?: IQueryBuilderContext) {
        if (context && context.queryExpression) {
            if (context.queryExpression instanceof SelectExpression) {
                const commandExp = context.queryExpression;

                if (column.entity.alias === commandExp.entity.alias || (commandExp instanceof GroupByExpression && isEntityExp(commandExp.key) && commandExp.key.alias === column.entity.alias)) {
                    if (column instanceof ComputedColumnExpression && (context.state !== "column-declared" || !commandExp.resolvedSelects.includes(column))) {
                        return this.toOperandString(column.expression, context);
                    }
                    return this.toString(column.entity) + "." + this.enclose(column.columnName);
                }
                else {
                    // need refactor, coz builder should not concern itself with this. it is visitor job. build should only do minimal work.
                    // now it needed coz select column from join table join child table.
                    let childSelect = commandExp.resolvedJoins.map((o) => o.child).find((selectExp) => selectExp.allSelects.some((o) => o.entity.alias === column.entity.alias));
                    if (!childSelect) {
                        childSelect = commandExp.parentRelation?.parent;
                    }
                    if (!childSelect) {
                        return this.toString(column.entity) + "." + this.enclose(column.columnName);
                    }

                    const useAlias = !commandExp.projectedColumns.includes(column);
                    return this.toString(childSelect.entity) + "." + this.enclose(useAlias ? column.dataPropertyName : column.columnName);
                }
            }
            else if (context.queryExpression instanceof InsertExpression) {
                const commandExp = context.queryExpression;

                if (column.entity.alias === commandExp.entity.alias) {
                    if (column instanceof ComputedColumnExpression && (context.state !== "column-declared" || !commandExp.columns.includes(column))) {
                        return this.toOperandString(column.expression, context);
                    }
                    return this.toString(column.entity) + "." + this.enclose(column.columnName);
                }
            }
            else if (context.queryExpression instanceof UpdateExpression) {
                const commandExp = context.queryExpression;

                if (column.entity.alias === commandExp.entity.alias) {
                    if (column instanceof ComputedColumnExpression && (context.state !== "column-declared" || !commandExp.entity.columns.includes(column))) {
                        return this.toOperandString(column.expression, context);
                    }
                    return this.toString(column.entity) + "." + this.enclose(column.columnName);
                }
            }
            return this.toString(column.entity) + "." + this.enclose(column.dataPropertyName);
        }

        return this.enclose(column.dataPropertyName);
    }
    protected getEntityQueryString<TE extends object>(entity: IEntityExpression<TE>, context?: IQueryBuilderContext): string {
        let entityQ = "";
        if (entity instanceof UnionExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.toSelectString(o, context)).join(`${this.newLine()}UNION${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof IntersectExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.toSelectString(o, context)).join(`${this.newLine()}INTERSECT${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof ExceptExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.toSelectString(o, context)).join(`${this.newLine()}EXCEPT${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof ConcatExpression) {
            entityQ = `(${this.newLine(1)}` +
                entity.subSelects.map(o => this.toSelectString(o, context)).join(`${this.newLine()}UNION ALL${this.newLine()}`) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof ProjectionEntityExpression) {
            entityQ = `(${this.newLine(1)}` +
                this.toSelectString(entity.subSelect, context) +
                `${this.newLine(-1)})`;
        }
        else if (entity instanceof RawEntityExpression) {
            entityQ = `(${entity.sqlTemplateStrings.reduce((res, str, i) => {
                let paramName = "";
                if (entity.parameters.length > i) {
                    paramName = this.toSqlParameterString(entity.parameters[i], context);
                }
                return res + str + paramName;
            }, "")})`;
        }
        else if (entity instanceof SqlTableValueParameterExpression) {
            if (context?.option?.supportTVP) {
                entityQ = this.toSqlParameterString(entity, context);
            }
            else {
                if (entity.asTempTable) {
                    entityQ = this.entityName(entity);
                }
                else {
                    const paramValue = context.parameters.get(entity);
                    return this.toTableValueConstructorQuery(entity, paramValue.value as TE[], context);
                }
            }
        }
        else {
            entityQ = this.entityName(entity);
        }

        return entityQ + (entity.alias ? " AS " + this.enclose(entity.alias) : "");
    }
    protected entityName<T extends object>(entityExp: IEntityExpression<T>) {
        let schemaString = "";
        if (entityExp.schema) {
            schemaString = `${this.enclose(entityExp.schema)}.`;
        }
        return schemaString + this.enclose(entityExp.name);
    }
    protected getInsertIntoQuery<TE extends object>(insertIntoExp: InsertIntoExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        const result: IQuery[] = [];
        const context = this.createContext(insertIntoExp, parameters, option);

        const selectString = this.toSelectString(insertIntoExp.select, context);
        const columns = insertIntoExp.columns.map((o) => this.enclose(o.columnName)).join(",");
        const selectQuery = `INSERT INTO ${this.entityName(insertIntoExp.entity)} (${columns})` + this.newLine() + selectString;
        result.push({
            query: selectQuery,
            type: QueryType.DML,
            parameters: this.getParameter(context)
        });

        return result;
    }
    protected getJoinQueryString<TE extends object>(joins: IEnumerable<JoinRelation<TE>>, context?: IQueryBuilderContext): string {
        let result = "";
        if (joins.some(() => true)) {
            result += this.newLine();
            result += Enumerable.from(joins).map((o) => {
                const childString = this.isSimpleSelect(o.child) ? this.getEntityQueryString(o.child.entity, context)
                    : "(" + this.newLine(1) + this.toSelectString(o.child, context) + this.newLine(-1) + ") AS " + this.enclose(o.child.entity.alias ?? o.child.entity.name);

                let joinStr = `${o.type} JOIN ${childString}`;
                if (o.relation) {
                    joinStr += ` ON ${this.toString(o.relation, context)}`;
                }

                return joinStr;
            }).toArray().join(this.newLine());
        }
        return result;
    }
    protected getPagingQueryString<TE extends object>(sqlExp: SelectExpression<TE>, context?: IQueryBuilderContext): string {
        let result = "";
        if (sqlExp.orders.length <= 0) {
            if (sqlExp.distinct || sqlExp.isAggregated) {
                result += `${this.newLine()}ORDER BY ${this.toString(sqlExp.projectedColumns.find(o => true), context)}`;
            }
            else {
                let column = sqlExp.entity.primaryColumns[0];
                if (!column) {
                    column = sqlExp.entity.columns[0];
                }
                result += `${this.newLine()}ORDER BY ${this.toString(column, context)}`;
            }
        }
        if (sqlExp.paging.skip) {
            result += `${this.newLine()}OFFSET ${this.toString(sqlExp.paging.skip, context)} ROWS`;
        }
        if (sqlExp.paging.take) {
            result += `${this.newLine()}FETCH NEXT ${this.toString(sqlExp.paging.take, context)} ROWS ONLY`;
        }
        return result;
    }
    protected getParameter(context: IQueryBuilderContext) {
        const paramObj = new Map<string, any>();
        let qparams = this.getQueryParameters(context);
        if (!context.option?.supportTVP) {
            qparams = qparams.filter(o => !(o instanceof SqlTableValueParameterExpression));
        }
        for (const [k, p] of context.parameters) {
            if (!qparams.includes(k)) {
                continue;
            }
            if (k instanceof SqlTableValueParameterExpression) {
                paramObj.set(`:${p.name}`, JSON.stringify(p.value));
            }
            else {
                paramObj.set(`:${p.name}`, p.value);
            }
        }

        return paramObj;
    }
    protected getParentJoinQueryString(parentRel: IQueryIncludeRelation, context?: IQueryBuilderContext) {
        if (!parentRel || parentRel instanceof JoinRelation) {
            return "";
        }

        let parent = parentRel.parent;
        while ((parent.parentRelation as ISelectRelation)?.isEmbedded) {
            parent = parent.parentRelation.parent;
        }

        let parentSelect: SelectExpression;
        switch (true) {
            case parent instanceof SelectExpression: {
                parentSelect = parent;
                break;
            }
            case parent instanceof UpdateExpression:
            case parent instanceof DeleteExpression: {
                parentSelect = parent.select;
                break;
            }
            default: {
                throw "invalid parent";
            }
        }
        const entityString = this.isSimpleSelect(parentSelect) ? this.getEntityQueryString(parent.entity, context) : `(${this.newLine(1)}${this.toSelectString(parentSelect, context)}${this.newLine(-1)}) AS ${this.enclose(parent.entity.alias ?? parent.entity.name)}`;
        const relationString = this.toLogicalString(parentRel.relation, context);
        return this.newLine() + `INNER JOIN ${entityString} ON ${relationString}`;
    }
    // TODO: catch paramExps at querycache
    protected getQueryParameters(context: IQueryBuilderContext) {
        const queryExp = context.rootQueryExpression ?? context.queryExpression;
        let paramExps = Enumerable.from(queryExp.paramExps);
        if (!(queryExp.parentRelation instanceof IncludeRelation)) {
            return paramExps;
        }

        let parentRelation = queryExp.parentRelation as ISelectRelation;
        while (parentRelation) {
            paramExps = paramExps.union(parentRelation.parent.paramExps);
            parentRelation = parentRelation.parent?.parentRelation;
        }

        return paramExps;
    }
    protected createContext(queryExp: IQueryExpression, parameters: ISqlParameterValueMap, option: IQueryOption): IQueryBuilderContext {
        return {
            queryExpression: queryExp,
            parameters: parameters,
            option: option
        };
    }
    protected getSelectQuery<TE extends object>(selectExp: SelectExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        let result: IQuery[] = [];
        const context = this.createContext(selectExp, parameters, option);

        const useTempTable = !option?.supportTVP && !selectExp.parentRelation && selectExp.includes.length;
        if (useTempTable) {
            for (const [key, valueExp] of parameters) {
                if (!(key instanceof SqlTableValueParameterExpression)) {
                    continue;
                }

                key.asTempTable = true;
                result.push(...this.getTempTableQuery(key, valueExp.value as unknown[], context));
            }
        }

        let skipInclude = false;
        // subselect should not have include
        if (selectExp.isSubSelect) {
            skipInclude = true;
        }

        if (!skipInclude) {
            // select each include as separated query as it more beneficial for performance
            for (const include of selectExp.resolvedIncludes) {
                if (!include.isManyToManyRelation) {
                    result = result.concat(this.getSelectQuery(include.child, context.option, context.parameters));
                }
                else {
                    // create relation data (clone select join clone child)
                    ArrayExtension.delete(selectExp.includes, include);
                    const cloneEntity = selectExp.entity.clone();
                    cloneEntity.isRelationData = true;
                    const relationData = new SelectExpression(cloneEntity);
                    cloneEntity.alias = "rel_" + cloneEntity.alias;

                    const childSelect = include.child;

                    const joinChildSelect = childSelect.clone();
                    joinChildSelect.entity.alias = "rel_" + joinChildSelect.entity.alias;

                    const relDataCloneMap = new Map();
                    mapReplaceExp(relDataCloneMap, childSelect, joinChildSelect);
                    mapReplaceExp(relDataCloneMap, selectExp, relationData);
                    relationData.includes = [];
                    relationData.addJoin(joinChildSelect, include.relation.clone(relDataCloneMap), "INNER");
                    relationData.selects = [];
                    relationData.itemExpression = new ObjectValueExpression({});
                    relationData.distinct = true;

                    // Bridge to Child relation
                    const bridgeChildRelation = new AndExpression();
                    for (const childCol of childSelect.primaryKeys) {
                        const bridgeCol = relationData.allColumns.find((o) => o.columnName === childCol.columnName);
                        relationData.selects.push(bridgeCol);
                        const logicalExp = new StrictEqualExpression(bridgeCol, childCol);
                        bridgeChildRelation.operands.push(logicalExp);
                    }
                    relationData.addInclude(include.name, childSelect, bridgeChildRelation.asOperand(), "one");

                    // Parent to Bridge relation
                    const parentBridgeRelation = new AndExpression();
                    const cloneMap = new Map();
                    mapReplaceExp(cloneMap, selectExp.entity, relationData.entity);
                    for (const parentCol of selectExp.primaryKeys) {
                        let bridgeCol = relationData.allColumns.find((o) => o.columnName === parentCol.columnName);
                        if (!bridgeCol) {
                            bridgeCol = parentCol.clone(cloneMap);
                        }
                        relationData.selects.push(bridgeCol);
                        const logicalExp = new StrictEqualExpression(parentCol, bridgeCol);
                        parentBridgeRelation.operands.push(logicalExp);
                    }
                    selectExp.addInclude(include.name, relationData, parentBridgeRelation.asOperand(), "many");

                    result = result.concat(this.getSelectQuery(relationData, context.option, context.parameters));
                }
            }
        }

        // select include before parent, coz result parser will parse include first before parent.
        // this way it will be much more easier to implement async iterator.
        result.push({
            query: this.toSelectString(selectExp, context),
            type: QueryType.DQL,
            parameters: this.getParameter(context)
        });
        return result;
    }
    protected toEntityString<TE extends object>(entityExp: IEntityExpression<TE>) {
        return this.enclose(entityExp.alias ?? `${entityExp.schema ? `${entityExp.schema}.` : ""}${entityExp.name}`);
    }
    protected toSelectString<TE extends object>(selectExp: SelectExpression<TE>, context?: IQueryBuilderContext): string {
        const distinct = selectExp.distinct ? " DISTINCT" : "";
        context = {
            ...context,
            rootQueryExpression: context.queryExpression,
            queryExpression: selectExp
        };

        const selects = Enumerable.from(selectExp.projectedColumns)
            .map((o) => {
                let colStr = this.getColumnQueryString(o, context);
                // NOTE: computed column should always has alias
                if (o.alias) {
                    colStr += " AS " + this.enclose(o.alias);
                }

                return colStr;
            })
            .toArray()
            .join("," + this.newLine(1, false));

        const entityQ = this.getEntityQueryString(selectExp.entity, context);

        if (selectExp instanceof GroupByExpression && !selectExp.isAggregated && selectExp.having && !Enumerable.from(selectExp.joins).ofType(HavingJoinRelation).some()) {
            const clone = selectExp.clone();
            clone.entity.alias = "rel_" + clone.entity.alias;
            clone.isAggregated = true;
            clone.distinct = true;
            clone.selects = clone.resolvedGroupBy.slice();

            const relation = new AndExpression();
            for (const col of selectExp.resolvedGroupBy) {
                const cloneCol = clone.resolvedGroupBy.find((o) => o.dataPropertyName === col.dataPropertyName);
                const logicalExp = new StrictEqualExpression(col, cloneCol);
                relation.operands.push(logicalExp);
            }

            const joinRel = clone.parentRelation = new JoinRelation(selectExp, clone, relation.asOperand(), "INNER");
            selectExp.joins.push(joinRel);
        }

        const joinStr = this.getJoinQueryString(selectExp.resolvedJoins, context) + this.getParentJoinQueryString(selectExp.parentRelation, context);

        let selectQuerySuffix = "";
        if (selectExp.where) {
            context.state = "column-declared";
            selectQuerySuffix += this.newLine() + "WHERE " + this.toLogicalString(selectExp.where, context);
            context.state = "";
        }

        if (selectExp instanceof GroupByExpression && selectExp.isAggregated) {
            if (selectExp.groupBy.length > 0) {
                selectQuerySuffix += this.newLine() + "GROUP BY " + selectExp.resolvedGroupBy.map((o) => this.getColumnQueryString(o, context)).join(", ");
            }
            if (selectExp.having) {
                selectQuerySuffix += this.newLine() + "HAVING " + this.toLogicalString(selectExp.having, context);
            }
        }

        const hasPagination = selectExp.paging.skip || selectExp.paging.take;
        if (selectExp.resolvedOrders.some(o => true) && (hasPagination || ((context.rootQueryExpression ?? context.queryExpression) == selectExp && !(selectExp.parentRelation instanceof JoinRelation)))) {
            selectQuerySuffix += this.newLine() + "ORDER BY " + selectExp.resolvedOrders.map((c) => this.toString(c.column, context) + " " + c.direction).join(", ");
        }

        if (hasPagination) {
            selectQuerySuffix += this.getPagingQueryString(selectExp, context);
        }

        return `SELECT${distinct} ${selects}`
            + this.newLine() + `FROM ${entityQ}${joinStr}${selectQuerySuffix}`;
    }
    protected createTVPExp<TE extends object>(alias: string, columns: IEnumerable<IColumnExpression<TE>>, values: SetterObj<TE>[], context: IQueryBuilderContext) {
        const tvpExp = new SqlTableValueParameterExpression(new ParameterExpression(this.newAlias("param"), Array as IObjectType<TE[]>), {} as TSchema<TE>, undefined, alias);
        const tvpValues: TE[] = [];
        for (const col of columns) {
            tvpExp.columns.push(new ColumnExpression(tvpExp, col.type, col.propertyName, col.columnName, col.isPrimary, true, col.columnMeta?.columnType));
        }

        for (const itemExp of values) {
            const itemValue: Partial<TE> = {};
            for (const col of columns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                itemValue[col.propertyName] = this.extractValue(valueExp as IExpression<TE[StringKeyOf<TE>]>, context);
                if (valueExp instanceof SqlParameterExpression) {
                    context.parameters.delete(valueExp);
                }
            }
            tvpValues.push(itemValue as TE);
        }

        context.parameters.set(tvpExp, { value: tvpValues });
        return tvpExp;
    }
    protected getTempTableQuery<TE extends object>(tvpExp: SqlTableValueParameterExpression<TE>, values: TE[], context?: IQueryBuilderContext): IQuery[] {
        const result: IQuery[] = [];
        result.push({
            query: `DROP TABLE IF EXISTS ${this.entityName(tvpExp)}`,
            type: QueryType.DDL
        });
        const columnDefinition = tvpExp.columns.map((c) => {
            const colType = this.translator.resolveValueType(c.type) ?? this.translator.resolveValueType(Null);
            return `${this.enclose(c.columnName)} ${this.columnTypeString(colType.columnType)}`;
        }).join("," + this.newLine(1, false));

        const query = `CREATE TEMPORARY TABLE ${this.entityName(tvpExp)}` +
            `${this.newLine()}(` +
            `${this.newLine(1, false)}${columnDefinition}` +
            `${this.newLine()})`;

        result.push({
            query,
            type: QueryType.DDL
        });

        let i = 0;
        const columns = tvpExp.columns;
        const insertQuery = new InsertExpression(tvpExp, [], columns);
        for (const item of values) {
            const itemExp: { [key: string]: IExpression } = {};
            for (const col of columns) {
                switch (col.propertyName) {
                    case "__index": {
                        itemExp[col.propertyName] = new ValueExpression(i++);
                        break;
                    }
                    case "__value": {
                        itemExp[col.propertyName] = new ValueExpression(item);
                        break;
                    }
                    default: {
                        const propVal = item[col.propertyName];
                        itemExp[col.propertyName] = new ValueExpression(isNotNull(propVal) ? propVal : null);
                        break;
                    }
                }
            }
            insertQuery.values.push(itemExp as SetterObj<TE>);
        }

        result.push(...this.getInsertQuery(insertQuery, context.option, context.parameters));

        for (const q of result) {
            q.type |= QueryType.ADDITIONAL;
        }

        return result;
    }
    protected toTableValueConstructorQuery<TE extends object>(entityExp: SqlTableValueParameterExpression<TE>, values: TE[], context?: IQueryBuilderContext): string {
        const columns = entityExp.columns.map(o => this.enclose(o.columnName)).join(", ");
        let i = 0;
        const valueLiterals = values.map(o => {
            const valueQuery = entityExp.columns.map(p => {
                const value = p.propertyName === "__index" ? i++ : o[p.propertyName];
                return this.valueString(value as ValueType);
            }).join(", ");
            return `(${valueQuery})`;
        }).join(`,${this.newLine(1, false)}`)
        return `(${this.newLine(1)}VALUES${this.newLine()}${valueLiterals}${this.newLine(-1)}) AS ${this.enclose(entityExp.alias)}(${columns})`;
    }
    protected getInsertQuery<TE extends object>(insertExp: InsertExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        if (insertExp.values.length <= 0) {
            return [];
        }

        const context = this.createContext(insertExp, parameters, option);
        const colString = Enumerable.from(insertExp.columns).map((o) => this.enclose(o.columnName)).reduce((acc, item) => acc ? acc + "," + item : item, "");
        const insertQuery = `INSERT INTO ${this.entityName(insertExp.entity)}${insertExp.entity.alias ? ` AS ${this.enclose(insertExp.entity.alias)}` : ""}(${colString}) VALUES`;
        let returning = "";
        if (insertExp.returnings.length) {
            returning = `${this.newLine()}RETURNING ${insertExp.returnings.map(o => {
                let colStr = this.getColumnQueryString(o, context);
                // NOTE: computed column should always has alias
                if (o.alias) {
                    colStr += " AS " + this.enclose(o.alias);
                }

                return colStr;
            }).join(",")}`;
        }

        this.indent++;
        let rowValues: string[] = [];
        // bulk insert
        for (const itemExp of insertExp.values) {
            const values: string[] = [];
            for (const col of insertExp.columns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    values.push(this.toString(valueExp, context));
                }
                else {
                    values.push("DEFAULT");
                }
            }

            rowValues.push(`(${values.join(",")})`);
        }
        const result: IQuery[] = [{
            query: `${insertQuery}${this.newLine()}${rowValues.join(`,${this.newLine()}`)}${returning}`,
            type: returning ? QueryType.DML | QueryType.DQL : QueryType.DML,
            parameters: this.getParameter(context)
        }];
        this.indent--;

        return result;
    }
    // TODO: Update Query use ANSI SQL Standard
    protected abstract getUpdateQuery<TE extends object>(updateExp: UpdateExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[];
    protected getUpsertQuery<TE extends object>(upsertExp: UpsertExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        if (upsertExp.values.length <= 0) {
            return [];
        }

        const joinString: string[] = [];

        const results: IQuery[] = [];
        const context = this.createContext(upsertExp, parameters, option);

        const tvpExp = this.createTVPExp("upsert", Enumerable.from(upsertExp.entity.primaryColumns).union(upsertExp.insertColumns, upsertExp.entity.columns.filter(o => o.propertyName in upsertExp.setter)), upsertExp.values, context);
        const targetAlias = upsertExp.entity.alias ?? "target";
        for (const o of upsertExp.entity.primaryColumns) {
            joinString.push(`${this.enclose(targetAlias)}.${this.enclose(o.columnName)} = ${this.enclose(tvpExp.alias)}.${this.enclose(o.columnName)}`);
        }
        let upsertQuery = `MERGE INTO ${this.entityName(upsertExp.entity)}${upsertExp.entity.alias ? ` AS ${this.enclose(upsertExp.entity.alias)}` : ""}` + this.newLine() +
            `USING ${this.getEntityQueryString(tvpExp, context)} ON ${joinString.join(" AND ")}` + this.newLine() +
            `WHEN MATCHED THEN` + this.newLine(1);

        const updateString = Enumerable.from(Object.keys(upsertExp.setter)).map((prop: StringKeyOf<TE>) => {
            const column = upsertExp.entity.columns.find(o => o.propertyName === prop);
            const valExp = upsertExp.setter[prop];
            const valStr = isNull(valExp) ? `${this.enclose(tvpExp.alias)}.${this.enclose(column.columnName)}` : this.toOperandString(valExp, context);
            return `${this.enclose(column.columnName)} = ${valStr}`;
        }).join(`,${this.newLine(1, false)}`);
        upsertQuery += this.newLine(1) + `UPDATE SET ${updateString}` + this.newLine(-1) +
            `WHEN NOT MATCHED THEN`;

        const colString = upsertExp.insertColumns.map((o) => this.enclose(o.columnName)).join(",");
        upsertQuery += this.newLine(1) + `INSERT (${colString})` + this.newLine() +
            `VALUES (${upsertExp.insertColumns.map((o) => `${this.enclose(tvpExp.alias)}.${this.enclose(o.columnName)}`).join(",")})` +
            this.newLine(-1);

        this.indent--;
        results.push({
            query: upsertQuery,
            type: QueryType.DML,
            parameters: this.getParameter(context)
        });

        if (upsertExp.returnings.length) {
            const selectExp = new SelectExpression(upsertExp.entity);
            selectExp.selects = upsertExp.returnings.slice(0);
            const relation = new AndExpression();
            for (const column of selectExp.entity.primaryColumns) {
                const newValueColumn = new ColumnExpression(tvpExp, column.type, column.propertyName, column.columnName, false, true, column.columnMeta.columnType);
                tvpExp.columns.push(newValueColumn);
                const rel = new StrictEqualExpression(column, newValueColumn);
                relation.operands.push(rel);
            }

            selectExp.paramExps.push(tvpExp);
            const valueSelectExp = new SelectExpression(tvpExp);
            valueSelectExp.selects = tvpExp.columns;
            valueSelectExp.isSubSelect = true;
            selectExp.addJoin(valueSelectExp, relation.asOperand(), "INNER");

            results.push(...this.getSelectQuery(selectExp, option, context.parameters));
        }

        return results;
    }
    protected getDeleteQuery<T extends object>(deleteExp: DeleteExpression<T>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        let result: IQuery[] = [];
        const context = this.createContext(deleteExp, parameters, option);

        const useTempTable = !option?.supportTVP && !deleteExp.parentRelation && deleteExp.includes.length;
        if (useTempTable) {
            for (const [key, valueExp] of parameters) {
                if (!(key instanceof SqlTableValueParameterExpression)) {
                    continue;
                }

                key.asTempTable = true;
                result.push(...this.getTempTableQuery(key, valueExp.value as unknown[], context));
            }
        }

        if (!deleteExp.entity.alias) {
            deleteExp.entity.alias = "d0";
        }

        const projectedEntity = new ProjectionEntityExpression(deleteExp.select);
        projectedEntity.alias = deleteExp.entity.alias + "_1";
        const selectExp = new SelectExpression(projectedEntity);
        selectExp.selects.length = 0;

        const pkFilter = new AndExpression();
        for (const col of deleteExp.entity.primaryColumns) {
            const subCol = projectedEntity.primaryColumns.find(o => o.propertyName == col.propertyName);
            const exp = new StrictEqualExpression(subCol, col);
            pkFilter.operands.push(exp);
        }
        selectExp.addWhere(pkFilter.asOperand());
        const entityString = `${this.newLine(1)}${this.toSelectString(selectExp, context)}${this.newLine(-1)}`;

        let deleteQuery = `DELETE FROM ${this.entityName(deleteExp.entity)} AS ${this.enclose(deleteExp.entity.alias)}` +
            this.newLine() + `WHERE EXISTS(${entityString})`;
        result.push({
            query: deleteQuery,
            type: QueryType.DML,
            parameters: this.getParameter(context)
        });

        const includedDeletes = deleteExp.includes.flatMap((o) => this.getDeleteQuery(o.child, context.option, context.parameters));
        result.push(...includedDeletes);
        return result;
    }
    protected isSimpleSelect(exp: SelectExpression) {
        return !(exp instanceof GroupByExpression) && !exp.where && exp.joins.length === 0
            && (!exp.parentRelation || exp.parentRelation instanceof JoinRelation && exp.parentRelation.childColumns.every((c) => exp.entity.columns.includes(c)))
            && !exp.paging.skip && !exp.paging.take
            && exp.selects.every((c) => !c.alias);
    }
    //#endregion

    //#region IExpression
    protected toArrayString(expression: ArrayValueExpression<any>, context?: IQueryBuilderContext): string {
        const itemStr = expression.items.map((o) => this.toOperandString(o, context)).join(", ");
        return `(${itemStr})`;
    }
    protected toFunctionCallString(expression: FunctionCallExpression<any>, context?: IQueryBuilderContext): string {
        const fn = ExpressionExecutor.execute(expression.fnExpression);
        const transformer = this.resolveTranslator(fn);
        if (transformer) {
            return transformer.translate(this, expression, context);
        }

        throw new Error(`function "${expression.functionName}" not suported`);
    }
    protected toInstantiationString(expression: InstantiationExpression, context?: IQueryBuilderContext) {
        const translator = this.resolveTranslator(expression.type);
        if (!translator) {
            try {
                const value = ExpressionExecutor.execute(expression);
                return this.valueString(value as ValueType);
            } catch (e) {
                throw new Error(`instantiate "${expression.type.name}" not supported`);
            }
        }
        return translator.translate(this, expression, context);
    }
    protected toMemberAccessString(exp: MemberAccessExpression<any, any>, context?: IQueryBuilderContext): string {
        let translater: IQueryTranslatorItem;
        if (exp.objectOperand.type === Object && exp.objectOperand instanceof ValueExpression) {
            translater = this.resolveTranslator(exp.objectOperand.value, exp.memberName);
        }
        if (!translater && exp.objectOperand.type) {
            translater = this.resolveTranslator(exp.objectOperand.type.prototype, exp.memberName);
        }

        if (translater) {
            return translater.translate(this, exp, context);
        }
        throw new Error(`${exp.memberName} not supported.`);
    }
    protected toMethodCallString<TE, K extends MethodKey<TE>, T = MethodReturnType<TE, K>>(exp: MethodCallExpression<TE, K, T>, context?: IQueryBuilderContext): string {
        let translator: IQueryTranslatorItem;
        if (exp.objectOperand instanceof SelectExpression) {
            translator = this.resolveTranslator(SelectExpression.prototype, exp.methodName as any);
        }
        else if (exp.objectOperand instanceof SqlParameterExpression || exp.objectOperand instanceof ParameterExpression || exp.objectOperand instanceof ValueExpression) {
            const value = this.extractValue(exp.objectOperand, context);
            translator = this.resolveTranslator(value, exp.methodName);
        }

        if (!translator) {
            translator = this.resolveTranslator(exp.objectOperand.type.prototype, exp.methodName);
        }

        if (translator) {
            return translator.translate(this, exp, context);
        }

        throw new Error(`${(exp.objectOperand.type as any).name}.${exp.methodName} not supported in linq to sql.`);
    }
    protected toOperatorString(expression: IBinaryOperatorExpression, context?: IQueryBuilderContext) {
        const translator = this.resolveTranslator(expression.constructor);
        if (!translator) {
            throw new Error(`operator "${expression.constructor.name}" not supported`);
        }
        return translator.translate(this, expression, context);
    }
    protected toRawSqlString(expression: RawSqlExpression, context?: IQueryBuilderContext) {
        return expression.sqlStatement;
    }
    protected toSqlParameterString(expression: SqlParameterExpression, context?: IQueryBuilderContext): string {
        const paramValue = context.parameters.get(expression);
        if (!paramValue) {
            throw new Error(`Sql Parameter ${expression.toString()} no supported`);
        }

        return `:${paramValue.name}`;
    }
    protected toValueString(expression: ValueExpression<any>, context?: IQueryBuilderContext): string {
        if (expression.value === undefined && expression.expressionString) {
            return expression.expressionString;
        }

        return this.valueString(expression.value);
    }
    //#endregion
}
