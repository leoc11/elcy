import "reflect-metadata";
import { ExpressionTransformer } from "../ExpressionBuilder/ExpressionTransformer";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { UnionExpression } from "../Queryable/QueryExpression/UnionExpression";
import { isNotNull, toDateTimeString, toTimeString, mapReplaceExp, isEntityExp, isColumnExp, toHexaString } from "../Helper/Util";
import { GenericType, QueryType, DeleteMode, TimeZoneHandling, NullConstructor } from "../Common/Type";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../Common/ColumnType";
import { IColumnTypeDefaults } from "../Common/IColumnTypeDefaults";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IQuery } from "./Interface/IQuery";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { ComputedColumnExpression } from "../Queryable/QueryExpression/ComputedColumnExpression";
import { ProjectionEntityExpression } from "../Queryable/QueryExpression/ProjectionEntityExpression";
import { IBinaryOperatorExpression } from "../ExpressionBuilder/Expression/IBinaryOperatorExpression";
import { IUnaryOperatorExpression } from "../ExpressionBuilder/Expression/IUnaryOperatorExpression";
import { MemberAccessExpression } from "../ExpressionBuilder/Expression/MemberAccessExpression";
import { MethodCallExpression } from "../ExpressionBuilder/Expression/MethodCallExpression";
import { FunctionCallExpression } from "../ExpressionBuilder/Expression/FunctionCallExpression";
import { TernaryExpression } from "../ExpressionBuilder/Expression/TernaryExpression";
import { ParameterExpression } from "../ExpressionBuilder/Expression/ParameterExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { EqualExpression } from "../ExpressionBuilder/Expression/EqualExpression";
import { IEntityExpression } from "../Queryable/QueryExpression/IEntityExpression";
import { IntersectExpression } from "../Queryable/QueryExpression/IntersectExpression";
import { ExceptExpression } from "../Queryable/QueryExpression/ExceptExpression";
import { IQueryTranslatorItem } from "./QueryTranslator/IQueryTranslatorItem";
import { ISaveChangesOption } from "./Interface/IQueryOption";
import { UpdateExpression } from "../Queryable/QueryExpression/UpdateExpression";
import { ISqlParameter } from "./ISqlParameter";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
import { IQueryCommandExpression } from "../Queryable/QueryExpression/IQueryCommandExpression";
import { SqlParameterExpression } from "../ExpressionBuilder/Expression/SqlParameterExpression";
import { QueryTranslator } from "./QueryTranslator/QueryTranslator";
import { InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import { IQueryLimit } from "../Data/Interface/IQueryLimit";
import { Enumerable } from "../Enumerable/Enumerable";
import { SelectIntoExpression } from "../Queryable/QueryExpression/SelectIntoExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { AndExpression } from "../ExpressionBuilder/Expression/AndExpression";
import { UpsertExpression } from "../Queryable/QueryExpression/UpsertExpression";
import { DateTimeColumnMetaData } from "../MetaData/DateTimeColumnMetaData";
import { TimeSpan } from "../Data/TimeSpan";
import { UUID } from "../Data/UUID";
import { TimeColumnMetaData } from "../MetaData/TimeColumnMetaData";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { InstantiationExpression } from "../ExpressionBuilder/Expression/InstantiationExpression";
import { BatchedQuery } from "./Interface/BatchedQuery";
import { JoinRelation } from "../Queryable/Interface/JoinRelation";
import { IncludeRelation } from "../Queryable/Interface/IncludeRelation";
import { ISelectRelation } from "../Queryable/Interface/ISelectRelation";
import { ObjectValueExpression } from "../ExpressionBuilder/Expression/ObjectValueExpression";
import { HavingJoinRelation } from "../Queryable/Interface/HavingJoinRelation";

export abstract class QueryBuilder extends ExpressionTransformer {
    public abstract supportedColumnTypes: Map<ColumnType, ColumnGroupType>;
    public abstract columnTypesWithOption: ColumnType[];
    public abstract columnTypeDefaults: Map<ColumnType, IColumnTypeDefaults>;
    public abstract columnTypeMap: Map<ColumnTypeMapKey, ColumnType>;
    public abstract valueTypeMap: Map<GenericType, ColumnType>;
    public abstract queryLimit: IQueryLimit;
    public options: ISaveChangesOption;
    public parameters: ISqlParameter[] = [];
    constructor(public namingStrategy: NamingStrategy, public translator: QueryTranslator) {
        super();
    }
    public resolveTranslator<T = any>(object: T, memberName?: keyof T) {
        return this.translator.resolve(object, memberName);
    }
    public setParameters(parameters: ISqlParameter[]) {
        this.parameters = parameters;
    }
    public getExpressionString<T = any>(expression: IExpression<T>): string {
        if (expression instanceof SelectExpression) {
            return this.getSelectQueryString(expression) + (expression.isSubSelect ? "" : ";");
        }
        else if (isColumnExp(expression)) {
            return this.getColumnString(expression);
        }
        else if (isEntityExp(expression)) {
            return this.entityQuery(expression);
        }
        else if (expression instanceof TernaryExpression) {
            return this.getOperatorString(expression as any);
        }
        else if ((expression as IBinaryOperatorExpression).rightOperand) {
            return `(${this.getOperatorString(expression as any)})`;
        }
        else if ((expression as IUnaryOperatorExpression).operand) {
            return this.getOperatorString(expression as any);
        }
        else {
            let result = "";
            switch (expression.constructor) {
                case MemberAccessExpression:
                    result = this.getMemberAccessExpressionString(expression as any);
                    break;
                case MethodCallExpression:
                    result = this.getMethodCallExpressionString(expression as any);
                    break;
                case FunctionCallExpression:
                    result = this.getFunctionCallExpressionString(expression as any);
                    break;
                case SqlParameterExpression:
                case ParameterExpression:
                    result = this.getParameterExpressionString(expression as any);
                    break;
                case ValueExpression:
                    result = this.ValueExpressionString(expression as any);
                    break;
                case InstantiationExpression:
                    result = this.getInstantiationString(expression as any);
                    break;
                default:
                    throw new Error(`Expression ${expression.toString()} not supported`);
            }
            return result;
        }
    }

    //#region Formatting
    protected indent = 0;
    private aliasObj: { [key: string]: number } = {};
    public enclose(identity: string) {
        if (this.namingStrategy.enableEscape && identity[0] !== "@" && identity[0] !== "#")
            return "\"" + identity + "\"";
        else
            return identity;
    }
    public newLine(indent = 0, isAdd = true) {
        indent += this.indent;
        if (isAdd) {
            this.indent = indent;
        }
        return "\n" + (Array(indent + 1).join("\t"));
    }
    public entityName(entityMeta: IEntityMetaData<any>) {
        return `${entityMeta.schema ? this.enclose(entityMeta.schema) + "." : ""}${this.enclose(entityMeta.name)}`;
    }
    public newAlias(type: "entity" | "column" | "param" = "entity") {
        if (!this.aliasObj[type])
            this.aliasObj[type] = 0;
        return this.namingStrategy.getAlias(type) + this.aliasObj[type]++;
    }
    public createTable<TE>(entity: IEntityExpression<TE>): IQuery[] {
        const columnDefinitions = entity.columns.select(column => {
            let columnType = this.valueTypeMap.get(column.type);
            if (!columnType) columnType = this.columnTypeMap.get("defaultString");
            return `${this.enclose(column.columnName)} ${this.getColumnType(columnType)}`;
        }).toArray().join("," + this.newLine(1, false));
        let query = `CREATE TABLE ${entity.name}` +
            `${this.newLine()}(` +
            `${this.newLine(1, false)}${columnDefinitions}` +
            `${this.newLine()})`;
        return [{
            query,
            type: QueryType.DDL
        }];
    }
    public getColumnType(type: ColumnType, option?: any) {
        const typeDefault = this.columnTypeDefaults.get(type);
        const size: number = option && typeof option.size !== "undefined" ? option.size : typeDefault ? typeDefault.size : undefined;
        const length: number = option && typeof option.length !== "undefined" ? option.length : typeDefault ? typeDefault.length : undefined;
        const scale: number = option && typeof option.scale !== "undefined" ? option.scale : typeDefault ? typeDefault.scale : undefined;
        const precision: number = option && typeof option.precision !== "undefined" ? option.precision : typeDefault ? typeDefault.precision : undefined;
        if (this.columnTypesWithOption.contains(type)) {
            if (typeof length !== "undefined") {
                type += `(${length})`;
            }
            else if (typeof size !== "undefined") {
                type += `(${size})`;
            }
            else if (typeof scale !== "undefined" && typeof precision !== "undefined") {
                type += `(${precision}, ${scale})`;
            }
            else if (typeof precision !== "undefined") {
                type += `(${precision})`;
            }
        }
        return type;
    }

    //#endregion

    //#region ICommandQueryExpression

    //#region Select

    protected commandExp?: IQueryCommandExpression;
    protected isColumnDeclared: boolean;
    public getSelectQuery<T>(select: SelectExpression<T>, skipInclude = false): IQuery[] {
        // subselect should not have include
        if (select.isSubSelect) skipInclude = true;

        const oldSelect = this.commandExp;
        this.commandExp = select;

        let result: IQuery[] = [];
        const take = this.extractValue(select.paging.take) || 0;
        const skip = this.extractValue(select.paging.skip) || 0;

        const distinct = select.distinct ? " DISTINCT" : "";
        const top = skip <= 0 && take > 0 ? " TOP " + take : "";
        const selects = Enumerable.from(select.projectedColumns).select((o) => {
            return this.columnSelectString(o);
        }).toArray().join("," + this.newLine(1, false));
        const entityQ = this.entityQuery(select.entity);

        if (select instanceof GroupByExpression && !select.isAggregate && select.having && !select.joins.ofType(HavingJoinRelation).any()) {
            const clone = select.clone();
            clone.entity.alias = "rel_" + clone.entity.alias;
            clone.isAggregate = true;
            clone.distinct = true;
            clone.selects = clone.resolvedGroupBy.slice();

            let relation: IExpression<boolean>;
            for (const col of select.resolvedGroupBy) {
                const cloneCol = clone.resolvedGroupBy.first(o => o.dataPropertyName === col.dataPropertyName);
                const logicalExp = new StrictEqualExpression(col, cloneCol);
                relation = relation ? new AndExpression(relation, logicalExp) : logicalExp;
            }

            const joinRel = clone.parentRelation = new JoinRelation(select, clone, relation, "INNER");
            select.joins.push(joinRel);
        }

        let joinStr = this.joinString(select.resolvedJoins) + this.getParentJoinString(select.parentRelation);

        let selectQuerySuffix = "";
        if (select.where) {
            this.isColumnDeclared = true;
            selectQuerySuffix += this.newLine() + "WHERE " + this.getLogicalOperandString(select.where);
            this.isColumnDeclared = false;
        }

        if (select instanceof GroupByExpression && select.isAggregate) {
            if (select.groupBy.length > 0) {
                selectQuerySuffix += this.newLine() + "GROUP BY " + select.resolvedGroupBy.select((o) => this.getColumnString(o)).toArray().join(", ");
            }
            if (select.having) {
                selectQuerySuffix += this.newLine() + "HAVING " + this.getLogicalOperandString(select.having);
            }
        }

        if ((!(select.parentRelation instanceof JoinRelation) || skip > 0) && select.orders.length > 0)
            selectQuerySuffix += this.newLine() + "ORDER BY " + select.orders.select((c) => this.getExpressionString(c.column) + " " + c.direction).toArray().join(", ");

        if (skip > 0) {
            selectQuerySuffix += this.newLine() + this.getPagingQueryString(select, take, skip);
        }

        let selectQuery = `SELECT${distinct}${top} ${selects}`
            + this.newLine() + `FROM ${entityQ}${joinStr}${selectQuerySuffix}`;

        if (!skipInclude) {
            // select each include as separated query as it more beneficial for performance
            for (const include of select.resolvedIncludes) {
                if (!include.isManyToManyRelation) {
                    result = result.concat(this.getSelectQuery(include.child));
                }
                else {
                    // create relation data (clone select join clone child)
                    select.includes.remove(include);
                    const cloneEntity = select.entity.clone();
                    cloneEntity.isRelationData = true;
                    const relationData = new SelectExpression(cloneEntity);
                    cloneEntity.alias = "rel_" + cloneEntity.alias;

                    const childSelect = include.child;

                    const joinChildSelect = childSelect.clone();
                    joinChildSelect.entity.alias = "rel_" + joinChildSelect.entity.alias;

                    const relDataCloneMap = new Map();
                    mapReplaceExp(relDataCloneMap, childSelect, joinChildSelect);
                    mapReplaceExp(relDataCloneMap, select, relationData);
                    relationData.includes = [];
                    relationData.addJoin(joinChildSelect, include.relations.clone(relDataCloneMap), "INNER");
                    relationData.selects = [];
                    relationData.itemExpression = new ObjectValueExpression({});
                    relationData.distinct = true;

                    // Bridge to Child relation
                    let bridgeChildRelation: IExpression<boolean>;
                    for (const childCol of childSelect.primaryKeys) {
                        const bridgeCol = relationData.allColumns.first(o => o.columnName === childCol.columnName);
                        relationData.selects.push(bridgeCol);
                        const logicalExp = new StrictEqualExpression(bridgeCol, childCol);
                        bridgeChildRelation = bridgeChildRelation ? new AndExpression(bridgeChildRelation, logicalExp) : logicalExp;
                    }
                    relationData.addInclude(include.name, childSelect, bridgeChildRelation, "one");

                    // Parent to Bridge relation
                    let parentBridgeRelation: IExpression<boolean>;
                    const cloneMap = new Map();
                    mapReplaceExp(cloneMap, select.entity, relationData.entity);
                    for (const parentCol of select.primaryKeys) {
                        let bridgeCol = relationData.allColumns.first(o => o.columnName === parentCol.columnName);
                        if (!bridgeCol) {
                            bridgeCol = parentCol.clone(cloneMap);
                        }
                        relationData.selects.push(bridgeCol);
                        const logicalExp = new StrictEqualExpression(parentCol, bridgeCol);
                        parentBridgeRelation = parentBridgeRelation ? new AndExpression(parentBridgeRelation, logicalExp) : logicalExp;
                    }
                    select.addInclude(include.name, relationData, parentBridgeRelation, "many");

                    result = result.concat(this.getSelectQuery(relationData));
                }
            }
        }

        // select include before parent, coz result parser will parse include first before parent.
        // this way it will be much more easier to implement async iterator.
        result.push({
            query: selectQuery,
            parameters: this.getParameter(select),
            type: QueryType.DQL
        });
        this.commandExp = oldSelect;
        return result;
    }
    protected getSelectQueryString(select: SelectExpression, skipInclude = false): string {
        let result = "";
        // if (select.isSubSelect) {
        //     result = "(" + this.newLine(1, true);
        // }
        result += this.getSelectQuery(select, skipInclude).select(o => o.query).toArray().join(";" + this.newLine() + this.newLine());
        // if (select.isSubSelect) {
        //     result += this.newLine(-1, true) + ")";
        // }

        return result;
    }
    protected extractValue<T>(exp: IExpression<T>): T {
        if (exp instanceof ValueExpression) {
            return exp.execute();
        }
        else {
            const takeParam = this.parameters.first(o => o.parameter === exp);
            if (takeParam)
                return takeParam.value as T;
        }
        return null;
    }
    protected columnSelectString(column: IColumnExpression): string {
        let result = "";
        if (column instanceof ComputedColumnExpression) {
            result = this.getOperandString(column.expression);
        }
        else {
            result = this.enclose(column.entity.alias) + "." + this.enclose(column.columnName);
        }
        // TODO: make computed column Expression always has alias
        if (column.alias) {
            result += " AS " + this.enclose(column.alias);
        }
        return result;
    }
    protected columnDefinition(column: IColumnExpression): string {
        if (column instanceof ComputedColumnExpression) {
            return this.getOperandString(column.expression);
        }
        return this.enclose(column.entity.alias) + "." + this.enclose(column.columnName);
    }
    protected entityQuery(entity: IEntityExpression): string {
        if (entity instanceof IntersectExpression) {
            return "(" + this.newLine(1) + this.getSelectQueryString(entity.subSelect) +
                this.newLine() + "INTERSECT" +
                this.newLine() + this.getSelectQueryString(entity.subSelect2) + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof UnionExpression) {
            let isUnionAll = false;
            if (entity.isUnionAll) {
                const isUnionAllParam = this.parameters.first(o => o.parameter.valueGetter === entity.isUnionAll);
                if (isUnionAllParam) {
                    isUnionAll = isUnionAllParam.value;
                }
            }
            return "(" + this.newLine(1) + this.getSelectQueryString(entity.subSelect) +
                this.newLine() + "UNION" + (isUnionAll ? " ALL" : "") +
                this.newLine() + this.getSelectQueryString(entity.subSelect2) + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof ExceptExpression) {
            return "(" + this.newLine(+1) + this.getSelectQueryString(entity.subSelect) +
                this.newLine() + "EXCEPT" +
                this.newLine() + this.getSelectQueryString(entity.subSelect2) + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof ProjectionEntityExpression) {
            return this.getSelectQueryString(entity.subSelect) + " AS " + this.enclose(entity.alias);
        }
        return this.enclose(entity.name) + (entity.alias ? " AS " + this.enclose(entity.alias) : "");
    }
    protected joinString<T>(joins: Iterable<JoinRelation<T, any>>): string {
        let result = "";
        const joinEnum = Enumerable.from(joins);
        if (joinEnum.any()) {
            result += this.newLine();
            result += joinEnum.select(o => {
                let childString = this.isSimpleSelect(o.child) ? this.entityQuery(o.child.entity)
                    : "(" + this.newLine(1) + this.getSelectQueryString(o.child, true) + this.newLine(-1) + ") AS " + this.enclose(o.child.entity.alias);
                const joinString = this.getExpressionString(o.relations);

                return `${o.type} JOIN ${childString}`
                    + this.newLine(1, false) + `ON ${joinString}`;
            }).toArray().join(this.newLine());
        }
        return result;
    }
    protected isSimpleSelect(exp: SelectExpression) {
        return !(exp instanceof GroupByExpression) && !exp.where && exp.joins.length === 0
            && (!exp.parentRelation || exp.parentRelation instanceof JoinRelation && exp.parentRelation.childColumns.all((c) => exp.entity.columns.contains(c)))
            && !exp.paging.skip && !exp.paging.take
            && exp.selects.all((c) => !c.alias);
    }
    protected getPagingQueryString(select: SelectExpression, take: number, skip: number): string {
        let result = "";
        if (take > 0)
            result += "LIMIT " + take + " ";
        result += "OFFSET " + skip;
        return result;
    }
    protected getParentJoinString<T>(parentRel: ISelectRelation) {
        if (!(parentRel instanceof IncludeRelation))
            return "";

        let parent = parentRel.parent;
        while (parent.parentRelation && parent.parentRelation.isEmbedded) {
            parent = parent.parentRelation.parent;
        }
        const entityString = this.isSimpleSelect(parent) ? this.entityQuery(parent.entity) : `(${this.newLine(1)}${this.getSelectQueryString(parent, true)}${this.newLine(-1)}) AS ${this.enclose(parent.entity.alias)}`;
        const relationString = this.getLogicalOperandString(parentRel.relations);
        return this.newLine() + `INNER JOIN ${entityString} ON ${relationString}`;
    }

    protected getColumnString(column: IColumnExpression) {
        if (this.commandExp) {
            if (this.commandExp instanceof SelectExpression) {
                if (column.entity.alias === this.commandExp.entity.alias || (this.commandExp instanceof GroupByExpression && isEntityExp(this.commandExp.key) && this.commandExp.key.alias === column.entity.alias)) {
                    if (column instanceof ComputedColumnExpression && (!this.isColumnDeclared || !this.commandExp.resolvedSelects.contains(column))) {
                        return this.getOperandString(column.expression);
                    }
                    return this.enclose(column.entity.alias) + "." + this.enclose(this.isColumnDeclared ? column.dataPropertyName : column.columnName);
                }
                else {
                    let childSelect = Enumerable.from(this.commandExp.resolvedJoins).select(o => o.child).first(o => Enumerable.from(o.allJoinedEntities).any(o => o.alias === column.entity.alias));
                    if (!childSelect) {
                        childSelect = this.commandExp.parentRelation.parent;
                    }
                    return this.enclose(childSelect.entity.alias) + "." + this.enclose(column.dataPropertyName);
                }
            }
            return this.enclose(column.entity.alias) + "." + this.enclose(column.dataPropertyName);
        }

        return this.enclose(column.dataPropertyName);
    }

    //#endregion

    //#region Select Insert
    public getSelectInsertQuery<T>(selectInto: SelectIntoExpression<T>): IQuery[] {
        let result: IQuery[] = [];
        const selectString = this.getSelectQueryString(selectInto.select, true);
        const columns = selectInto.projectedColumns.select((o) => this.enclose(o.columnName)).toArray().join(",");
        let selectQuery = `INSERT INTO ${this.entityQuery(selectInto.entity)}${this.newLine()} (${columns})` + this.newLine() + selectString;
        result.push({
            query: selectQuery,
            parameters: this.getParameter(selectInto),
            type: QueryType.DML
        });

        return result;
    }
    //#endregion

    //#region Insert
    public getInsertQuery<T>(insertExp: InsertExpression<T>): IQuery[] {
        if (insertExp.values.length <= 0)
            return [];

        const colString = insertExp.columns.select(o => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item);
        const insertQuery = `INSERT INTO ${this.enclose(insertExp.entity.name)}(${colString}) VALUES`;
        let queryCommand: IQuery = {
            query: insertQuery,
            parameters: {},
            type: QueryType.DML
        };
        const result: IQuery[] = [queryCommand];
        let parameterKeys: string[] = [];
        let isLimitExceed = false;
        this.indent++;
        insertExp.values.each(itemExp => {
            if (this.queryLimit.maxParameters) {
                const curParamKeys: string[] = [];
                for (const prop in itemExp) {
                    const value = itemExp[prop];
                    const param = this.parameters.first(o => o.parameter === value);
                    if (param) {
                        curParamKeys.push(param.name);
                    }
                }
                const keys = parameterKeys.union(curParamKeys).toArray();
                isLimitExceed = keys.length > this.queryLimit.maxParameters;
                if (!isLimitExceed) {
                    parameterKeys = keys;
                }
            }

            if (isLimitExceed) {
                queryCommand.query = queryCommand.query.slice(0, -1);
                queryCommand.parameters = parameterKeys.select(o => this.parameters.first(p => p.name === o)).reduce({} as { [key: string]: any }, (acc, item) => {
                    acc[item.name] = item.value;
                    return acc;
                });

                isLimitExceed = false;
                parameterKeys = [];

                queryCommand = {
                    query: insertQuery,
                    parameters: {},
                    type: QueryType.DML
                };
                result.push(queryCommand);
            }
            queryCommand.query += `${this.newLine(1)}(${insertExp.columns.select(o => {
                const valueExp = itemExp[o.propertyName];
                return valueExp ? this.getExpressionString(valueExp) : "DEFAULT";
            }).toArray().join(",")}),`;
        });
        this.indent--;
        queryCommand.query = queryCommand.query.slice(0, -1);
        queryCommand.parameters = parameterKeys.select(o => this.parameters.first(p => p.name === o)).reduce({} as { [key: string]: any }, (acc, item) => {
            acc[item.name] = item.value;
            return acc;
        });
        return result;
    }
    //#endregion

    //#region Update
    public getBulkUpdateQuery<T>(update: UpdateExpression<T>): IQuery[] {
        let result: IQuery[] = [];
        const setQuery = Object.keys(update.setter).select((o: keyof T) => {
            const value = update.setter[o];
            const valueStr = this.getExpressionString(value);
            const column = update.entity.columns.first(c => c.propertyName === o);
            return `${this.enclose(update.entity.alias)}.${this.enclose(column.columnName)} = ${valueStr}`;
        }).toArray().join(", ");
        let updateQuery = `UPDATE ${this.enclose(update.entity.alias)}` +
            this.newLine() + `SET ${setQuery}` +
            this.newLine() + `FROM ${this.enclose(update.entity.name)} AS ${this.enclose(update.entity.alias)} ` +
            this.joinString(update.joins);
        if (update.where)
            updateQuery += this.newLine() + "WHERE " + this.getLogicalOperandString(update.where);

        result.push({
            query: updateQuery,
            parameters: this.getParameter(update),
            type: QueryType.DML
        });

        return result;
    }
    //#endregion

    //#region Upsert
    public getUpsertQuery(upsertExp: UpsertExpression): IQuery[] {
        let pkValues: string[] = [];
        let joinString: string[] = [];
        upsertExp.entity.primaryColumns.each(o => {
            const index = upsertExp.columns.indexOf(o);
            const valueExp = upsertExp.setter[index];
            pkValues.push(`${this.getExpressionString(valueExp)} AS ${this.enclose(o.columnName)}`);
            joinString.push(`_VAL.${this.enclose(o.columnName)} = ${this.getColumnString(o)}`);
        });

        let upsertQuery = `MERGE INTO ${this.entityQuery(upsertExp.entity)}` + this.newLine() +
            `USING (SELECT ${pkValues.join(", ")}) AS _VAL ON ${joinString.join(" AND ")}` + this.newLine() +
            `WHEN MATCHED THEN` + this.newLine(1, true);

        const updateString = upsertExp.updateColumns.select(column => {
            const value = upsertExp.setter[column.propertyName];
            if (!value) return undefined;

            return `${this.enclose(column.columnName)} = ${this.getOperandString(value)}`;
        }).where(o => !!o).toArray().join(`,${this.newLine(1)}`);

        upsertQuery += `UPDATE SET ${updateString}` + this.newLine(-1, true) +
            `WHEN NOT MATCHED THEN` + this.newLine(1, true);

        const colString = upsertExp.columns.select(o => this.enclose(o.columnName)).toArray().join(",");
        const insertQuery = `INSERT (${colString})` + this.newLine() +
            `VALUES (${upsertExp.columns.select(o => {
                const valueExp = upsertExp.setter[o.propertyName];
                return valueExp ? this.getExpressionString(valueExp) : "DEFAULT";
            }).toArray().join(",")})`;

        upsertQuery += insertQuery;
        this.indent--;

        const param: { [key: string]: any } = {};
        for (const prop in upsertExp.setter) {
            const val = upsertExp.setter[prop];
            const paramExp = this.parameters.first(p => p.parameter === val);
            if (paramExp) {
                param[paramExp.name] = paramExp.value;
            }
        }
        return [{
            query: upsertQuery,
            parameters: param,
            type: QueryType.DML
        }];
    }
    //#endregion

    //#region Delete
    public getBulkDeleteQuery<T>(deleteExp: DeleteExpression<T>): IQuery[] {
        let result: IQuery[] = [];
        let deleteStrategy: DeleteMode;
        if (deleteExp.deleteMode) {
            if (deleteExp.deleteMode instanceof ParameterExpression) {
                const modeParam = this.parameters.first(o => o.parameter.valueGetter === deleteExp.deleteMode);
                if (modeParam) {
                    deleteStrategy = modeParam.value;
                }
            }
            else {
                deleteStrategy = deleteExp.deleteMode.execute();
            }
        }

        if (!deleteStrategy) {
            deleteStrategy = deleteExp.entity.deleteColumn ? "Soft" : "Hard";
        }

        else if (deleteStrategy === "Soft" && !deleteExp.entity.deleteColumn) {
            // if entity did not support soft delete, then abort.
            return result;
        }

        if (deleteStrategy === "Soft") {
            // if soft delete, set delete column to true
            const set: { [key in keyof T]?: IExpression<T[key]> } = {};
            set[deleteExp.entity.deleteColumn.propertyName] = new ValueExpression(true) as any;
            const updateQuery = new UpdateExpression(deleteExp.entity, set);
            result = this.getBulkUpdateQuery(updateQuery);

            // apply delete option rule. coz soft delete delete option will not handled by db.
            const entityMeta: IEntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, deleteExp.entity.type);
            const relations = entityMeta.relations.where(o => o.isMaster);
            result = result.concat(relations.selectMany(o => {
                const isManyToMany = o.completeRelationType === "many-many";
                const target = !isManyToMany ? o.target : o.relationData;
                const deleteOption = !isManyToMany ? o.reverseRelation.deleteOption : o.relationData.deleteOption;
                const relationColumns = !isManyToMany ? o.reverseRelation.relationColumns : o.relationData.source === entityMeta ? o.relationData.sourceRelationColumns : o.relationData.targetRelationColumns;
                let child = new SelectExpression(new EntityExpression(target.type, target.type.name));
                child.addJoin(deleteExp.select, o.reverseRelation);
                switch (deleteOption) {
                    case "CASCADE": {
                        const childDelete = new DeleteExpression(child, deleteExp.deleteMode);
                        if (childDelete.entity.deleteColumn && !(this.options && this.options.includeSoftDeleted)) {
                            childDelete.addWhere(new StrictEqualExpression(childDelete.entity.deleteColumn, new ValueExpression(false)));
                        }
                        return this.getBulkDeleteQuery(childDelete);
                    }
                    case "SET NULL": {
                        const setOption: { [key: string]: any } = {};
                        for (const col of relationColumns) {
                            setOption[col.propertyName] = null;
                        }
                        const childUpdate = new UpdateExpression(child, setOption);
                        return this.getBulkUpdateQuery(childUpdate);
                    }
                    case "SET DEFAULT": {
                        const setOption: { [key: string]: any } = {};
                        for (const col of o.reverseRelation.relationColumns) {
                            if (col.default)
                                setOption[col.columnName] = col.default.execute();
                            else
                                setOption[col.columnName] = null;
                        }
                        const childUpdate = new UpdateExpression(child, setOption);
                        return this.getBulkUpdateQuery(childUpdate);
                    }
                    case "NO ACTION":
                    case "RESTRICT":
                    default:
                        return [];
                }
            }).toArray());
        }
        else {
            let selectQuery = `DELETE ${this.enclose(deleteExp.entity.alias)}` +
                this.newLine() + `FROM ${this.enclose(deleteExp.entity.name)} AS ${this.enclose(deleteExp.entity.alias)} ` +
                this.joinString(deleteExp.joins);
            if (deleteExp.where)
                selectQuery += this.newLine() + "WHERE " + this.getLogicalOperandString(deleteExp.where);
            result.push({
                query: selectQuery,
                parameters: this.getParameter(deleteExp),
                type: QueryType.DML
            });
        }

        const clone = deleteExp.clone();

        let replaceMap = new Map();
        for (const col of deleteExp.entity.columns) {
            const cloneCol = clone.entity.columns.first(c => c.columnName === col.columnName);
            replaceMap.set(col, cloneCol);
        }
        const includedDeletes = deleteExp.includes.selectMany(o => {
            const child = o.child.clone();
            for (const col of o.child.entity.columns) {
                const cloneChildCol = child.entity.columns.first(c => c.columnName === col.columnName);
                replaceMap.set(col, cloneChildCol);
            }
            const relations = o.relations.clone(replaceMap);
            child.addJoin(clone.select, relations, "INNER");
            if (clone.select.where) {
                child.addWhere(clone.select.where);
                clone.select.where = null;
            }
            return this.getBulkDeleteQuery(child);
        }).toArray();
        result = result.concat(includedDeletes);

        return result;
    }
    //#endregion

    public mergeQueryCommands(queries: Iterable<IQuery>): IQuery[] {
        let queryCommand = new BatchedQuery();
        const result: IQuery[] = [queryCommand];
        let parameterKeys: string[] = [];
        Enumerable.from(queries).each(o => {
            let isLimitExceed = false;
            if (this.queryLimit.maxBatchQuery) {
                isLimitExceed = queryCommand.queryCount > this.queryLimit.maxBatchQuery;
            }
            if (!isLimitExceed && this.queryLimit.maxQueryLength) {
                isLimitExceed = queryCommand.query.length + o.query.length > this.queryLimit.maxQueryLength;
            }
            if (!isLimitExceed && this.queryLimit.maxParameters && o.parameters) {
                const keys = parameterKeys.union(Object.keys(o.parameters)).toArray();
                isLimitExceed = keys.length > this.queryLimit.maxParameters;
                if (!isLimitExceed) {
                    parameterKeys = keys;
                }
            }

            if (isLimitExceed) {
                parameterKeys = [];
                queryCommand = new BatchedQuery();
                result.push(queryCommand);
            }
            queryCommand.add(o);
        });
        return result;
    }
    protected getParameter<T>(command: IQueryCommandExpression<T>) {
        const param: { [key: string]: any } = {};
        command.parameters.select(o => this.parameters.first(p => p.parameter === o)).where(o => !!o).each(o => {
            param[o.name] = o.value;
        });
        return param;
    }

    //#endregion

    //#region Value

    public valueString(value: any): string {
        if (isNotNull(value)) {
            switch (value.constructor) {
                case Number:
                    return this.numberString(value);
                case Boolean:
                    return this.booleanString(value);
                case String:
                    return this.stringString(value);
                case Date:
                    return this.dateTimeString(value);
                case TimeSpan:
                    return this.timeString(value);
                case UUID:
                    return this.identifierString(value);
                case ArrayBuffer:
                case Uint8Array:
                case Uint16Array:
                case Uint32Array:
                case Int8Array:
                case Int16Array:
                case Int32Array:
                case Uint8ClampedArray:
                case Float32Array:
                case Float64Array:
                case DataView:
                    return toHexaString(value);
                default:
                    throw new Error(`type "${value.constructor.name}" not supported`);
            }
        }
        return this.nullString();
    }
    protected dateTimeString(value: Date): string {
        return this.stringString(toDateTimeString(value));
    }
    protected timeString(value: TimeSpan): string {
        return this.stringString(toTimeString(value));
    }
    protected identifierString(value: UUID): string {
        return this.stringString(value.toString());
    }
    protected nullString() {
        return "NULL";
    }
    public stringString(value: string) {
        return "'" + this.escapeString(value) + "'";
    }
    protected escapeString(value: string) {
        return value.replace(/'/ig, "''");
    }
    protected booleanString(value: boolean) {
        return value ? "1" : "0";
    }
    protected numberString(value: number) {
        return value.toString();
    }

    //#endregion

    //#region IExpression

    protected ValueExpressionString(expression: ValueExpression<any>): string {
        if (expression.value === undefined && expression.expressionString)
            return expression.expressionString;

        return this.valueString(expression.value);
    }
    protected getInstantiationString(expression: InstantiationExpression) {
        const translator = this.resolveTranslator(expression.type);
        if (!translator) {
            try {
                const value = expression.execute();
                return this.valueString(value);
            } catch (e) { }
            throw new Error(`instantiate "${expression.type.name}" not supported`);
        }
        return translator.translate(expression, this);
    }
    protected getOperatorString(expression: IBinaryOperatorExpression) {
        const translator = this.resolveTranslator(expression.constructor);
        if (!translator) {
            throw new Error(`operator "${expression.constructor.name}" not supported`);
        }
        return translator.translate(expression, this);
    }
    public getLogicalOperandString(expression: IExpression<boolean>) {
        if (isColumnExp(expression)) {
            expression = new EqualExpression(expression, new ValueExpression(true));
        }
        return this.getExpressionString(expression);
    }
    protected getFunctionCallExpressionString(expression: FunctionCallExpression<any>): string {
        const fn = expression.fnExpression.execute();
        let transformer = this.resolveTranslator(fn);
        if (transformer) {
            return transformer.translate(expression, this);
        }

        throw new Error(`function "${expression.functionName}" not suported`);
    }
    protected getMemberAccessExpressionString(expression: MemberAccessExpression<any, any>): string {
        let translater: IQueryTranslatorItem;
        if (expression.objectOperand.type === Object && expression.objectOperand instanceof ValueExpression) {
            translater = this.resolveTranslator(expression.objectOperand.value, expression.memberName);
        }
        if (!translater && expression.objectOperand.type) {
            translater = this.resolveTranslator(expression.objectOperand.type.prototype, expression.memberName);
        }

        if (translater) {
            return translater.translate(expression, this);
        }
        throw new Error(`${expression.memberName} not supported.`);
    }
    protected getMethodCallExpressionString<TType, KProp extends keyof TType, TResult = any>(expression: MethodCallExpression<TType, KProp, TResult>): string {
        let translator: IQueryTranslatorItem;
        if (expression.objectOperand instanceof SelectExpression) {
            translator = this.resolveTranslator(SelectExpression.prototype, expression.methodName as any);
        }
        else if (expression.objectOperand instanceof ValueExpression) {
            translator = this.resolveTranslator(expression.objectOperand.value, expression.methodName);
        }

        if (!translator) {
            translator = this.resolveTranslator(expression.objectOperand.type.prototype, expression.methodName);
        }

        if (translator) {
            return translator.translate(expression, this);
        }

        throw new Error(`${(expression.objectOperand.type as any).name}.${expression.methodName} not supported in linq to sql.`);
    }
    protected getParameterExpressionString(expression: ParameterExpression): string {
        const paramValue = this.parameters.first(o => o.parameter === expression);
        if (paramValue) {
            if (!isNotNull(paramValue.value)) {
                return this.nullString();
            }
            return "@" + paramValue.name;
        }
        return "@" + expression.name;
    }
    public getOperandString(expression: IExpression): string {
        if (isEntityExp(expression)) {
            // TODO: dead code
            const column = expression.primaryColumns.length > 0 ? expression.primaryColumns[0] : expression.columns[0];
            return this.getColumnString(column);
        }
        else if (expression.type === Boolean && !(expression instanceof ValueExpression) && !isColumnExp(expression)) {
            expression = new TernaryExpression(expression, new ValueExpression(true), new ValueExpression(false));
        }

        return this.getExpressionString(expression);
    }

    //#endregion

    //#region Value Convert
    public toPropertyValue<T>(input: any, column: IColumnExpression<any, T>): T {
        let result: any;
        if (input === null && column.isNullable) {
            return null;
        }
        switch (column.type as any) {
            case Boolean:
                result = Boolean(input);
                break;
            case Number:
                result = Number.parseFloat(input);
                if (!isFinite(result)) {
                    result = column.columnMetaData && column.columnMetaData.nullable ? null : 0;
                }
                break;
            case String:
                result = input ? input.toString() : input;
                break;
            case Date: {
                result = new Date(input);
                const colMeta = column.columnMetaData;
                const timeZoneHandling: TimeZoneHandling = colMeta instanceof DateTimeColumnMetaData ? colMeta.timeZoneHandling : "none";
                if (timeZoneHandling !== "none")
                    result = (result as Date).fromUTCDate();
                break;
            }
            case TimeSpan: {
                result = typeof input === "number" ? new TimeSpan(input) : TimeSpan.parse(input);
                const colMeta = column.columnMetaData;
                const timeZoneHandling: TimeZoneHandling = colMeta instanceof TimeColumnMetaData ? colMeta.timeZoneHandling : "none";
                if (timeZoneHandling !== "none")
                    result = result.addMinutes(-(new Date(result.totalMilliSeconds())).getTimezoneOffset());
                break;
            }
            case UUID: {
                result = input ? new UUID(input.toString()) : UUID.empty;
                break;
            }
            default:
                throw new Error(`${column.type.name} not supported`);
        }
        return result;
    }
    public toParameterValue(input: any, column: IColumnMetaData): any {
        let result = input;
        const type = column ? column.type : isNotNull(input) ? input.constructor : NullConstructor;
        switch (type) {
            case Date: {
                const timeZoneHandling: TimeZoneHandling = column instanceof DateTimeColumnMetaData ? column.timeZoneHandling : "none";
                if (timeZoneHandling !== "none")
                    result = (result as Date).toUTCDate();
                break;
            }
            case TimeSpan: {
                result = typeof input === "number" ? new TimeSpan(input) : TimeSpan.parse(input);
                const timeZoneHandling: TimeZoneHandling = column instanceof TimeColumnMetaData ? column.timeZoneHandling : "none";
                if (timeZoneHandling !== "none")
                    result = (result as TimeSpan).addMinutes((new Date(result.totalMilliSeconds())).getTimezoneOffset());
                break;
            }
        }
        return result;
    }
    //#endregion
}
