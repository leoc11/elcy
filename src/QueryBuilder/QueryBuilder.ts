import "reflect-metadata";
import { ExpressionTransformer } from "../ExpressionBuilder/ExpressionTransformer";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { SelectExpression, IJoinRelation } from "../Queryable/QueryExpression/SelectExpression";
import { UnionExpression } from "../Queryable/QueryExpression/UnionExpression";
import { fillZero, isNotNull } from "../Helper/Util";
import { JoinType, GenericType, QueryType, DeleteMode } from "../Common/Type";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../Common/ColumnType";
import { IColumnTypeDefaults } from "../Common/IColumnTypeDefaults";
import { CustomEntityExpression } from "../Queryable/QueryExpression/CustomEntityExpression";
import { entityMetaKey } from "../Decorator/DecoratorKey";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IQuery } from "./Interface/IQuery";
import { EmbeddedColumnExpression } from "../Queryable/QueryExpression/EmbeddedColumnExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { ColumnExpression } from "../Queryable/QueryExpression/ColumnExpression";
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
import { IQueryOption } from "./Interface/IQueryOption";
import { UpdateExpression } from "../Queryable/QueryExpression/UpdateExpression";
import { ISqlParameter } from "./ISqlParameter";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
import { IQueryCommandExpression } from "../Queryable/QueryExpression/IQueryCommandExpression";
import { SqlParameterExpression } from "../ExpressionBuilder/Expression/SqlParameterExpression";
import { QueryTranslator } from "./QueryTranslator/QueryTranslator";
import { InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import { IQueryLimit } from "../Data/Interface/IQueryLimit";
import { Enumerable } from "../Enumerable/Enumerable";

export abstract class QueryBuilder extends ExpressionTransformer {
    public abstract supportedColumnTypes: Map<ColumnType, ColumnGroupType>;
    public abstract columnTypesWithOption: ColumnType[];
    public abstract columnTypeDefaults: Map<ColumnType, IColumnTypeDefaults>;
    public abstract columnTypeMap: Map<ColumnTypeMapKey, ColumnType>;
    public abstract valueTypeMap: Map<GenericType, ColumnType>;
    public abstract queryLimit: IQueryLimit;
    protected indent = 0;
    public options: IQueryOption;
    public parameters: ISqlParameter[] = [];

    constructor(public namingStrategy: NamingStrategy, public translator: QueryTranslator) {
        super();
    }
    protected resolveTranslator(object: any, memberName?: string) {
        return this.translator.resolve(object, memberName);
    }
    private aliasObj: { [key: string]: number } = {};
    public lastInsertedIdentity() {
        return "LAST_INSERT_ID()";
    }
    public setParameters(parameters: ISqlParameter[]) {
        this.parameters = parameters;
    }
    //#region Formatting

    public newAlias(type: "entity" | "column" | "param" = "entity") {
        if (!this.aliasObj[type])
            this.aliasObj[type] = 0;
        return this.namingStrategy.getAlias(type) + this.aliasObj[type]++;
    }
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

    //#endregion

    //#region ICommandQueryExpression
    public mergeQueryCommands(queries: Iterable<IQuery>): IQuery[] {
        let queryCommand: IQuery = {
            query: "",
            parameters: {},
            type: 0 as any
        };
        const result: IQuery[] = [queryCommand];
        let parameterKeys: string[] = [];
        let batchQueryCount = 0;
        new Enumerable(queries).each(o => {
            let isLimitExceed = false;
            if (this.queryLimit.maxBatchQuery) {
                isLimitExceed = batchQueryCount > this.queryLimit.maxBatchQuery;
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
                batchQueryCount = 0;
                parameterKeys = [];
                queryCommand = {
                    query: "",
                    parameters: {},
                    type: o.type
                };
                result.push(queryCommand);
            }
            batchQueryCount++;
            queryCommand.query += (queryCommand.query ? ";\n\n" : "") + o.query;
            queryCommand.type |= o.type;
            if (o.parameters)
                Object.assign(queryCommand.parameters, o.parameters);
        });
        return result;
    }
    // Select
    public getSelectQuery<T>(select: SelectExpression<T>): IQuery[] {
        let result: IQuery[] = [];
        const hasIncludes = select.includes.length > 0;
        let take = 0, skip = 0;
        if (select.paging.take) {
            const takeParam = this.parameters.first(o => o.parameter.valueGetter === select.paging.take);
            if (takeParam) {
                take = takeParam.value;
            }
        }
        if (select.paging.skip) {
            const skipParam = this.parameters.first(o => o.parameter.valueGetter === select.paging.skip);
            if (skipParam)
                skip = skipParam.value;
        }
        const tempTableName = "#temp_" + (select.entity.alias ? select.entity.alias : select.entity.name);
        let selectQuery = "";
        if (hasIncludes) {
            selectQuery = `CREATE TEMP TABLE ${tempTableName} AS (${this.newLine(1, true)}`;
        }
        selectQuery += "SELECT" + (select.distinct ? " DISTINCT" : "") + (skip <= 0 && take > 0 ? " TOP " + take : "") +
            " " + select.projectedColumns.select((o) => this.getColumnSelectString(o)).toArray().join("," + this.newLine(1, false)) +
            this.newLine() + "FROM " + this.getEntityQueryString(select.entity) +
            this.getEntityJoinString(select.entity, select.joins);
        if (select.where)
            selectQuery += this.newLine() + "WHERE " + this.getOperandString(select.where);
        if (select instanceof GroupByExpression) {
            if (select.groupBy.length > 0) {
                selectQuery += this.newLine() + "GROUP BY " + select.groupBy.select((o) => this.getColumnDefinitionString(o)).toArray().join(", ");
            }
            if (select.having) {
                selectQuery += this.newLine() + "HAVING " + this.getOperandString(select.having);
            }
        }
        if (select.orders.length > 0)
            selectQuery += this.newLine() + "ORDER BY " + select.orders.select((c) => this.getExpressionString(c.column) + " " + c.direction).toArray().join(", ");

        if (skip > 0) {
            selectQuery += this.newLine() + this.getPagingQueryString(select, take, skip);
        }

        if (hasIncludes) {
            selectQuery = `${this.newLine(-1, true)})`;
        }

        result.push({
            query: selectQuery,
            parameters: this.getParameter(select),
            type: hasIncludes ? QueryType.DDL | QueryType.DML : QueryType.DQL
        });
        // if has other includes, then convert to temp table
        if (hasIncludes) {
            result.push({
                query: `SELECT * FROM ${tempTableName}`,
                type: QueryType.DQL
            });

            const tempSelect = new SelectExpression(new CustomEntityExpression(tempTableName, select.projectedColumns.select(o => {
                if (o instanceof ComputedColumnExpression)
                    return new ColumnExpression(o.entity, o.type, o.propertyName, o.columnName, o.isPrimary);
                return o;
            }).toArray(), select.itemType, tempTableName.substr(1)));
            // select each include as separated query as it more beneficial for performance
            for (const include of select.includes) {
                // add join to temp table
                const reverseRelation = new Map();
                for (const [key, value] of include.relations) {
                    const tempKey = tempSelect.entity.columns.first(o => o.columnName === key.columnName);
                    reverseRelation.set(value, tempKey);
                }
                const tempJoin = include.child.addJoinRelation(tempSelect, reverseRelation, JoinType.INNER);
                result = result.concat(this.getSelectQuery(include.child));
                include.child.joins.remove(tempJoin);
            }

            result.push({
                query: `DROP TABLE ${tempTableName}`,
                type: QueryType.DDL
            });
        }
        return result;
    }
    // Insert
    public getInsertQuery<T>(insertExp: InsertExpression<T>): IQuery[] {
        const colString = insertExp.columns.select(o => this.enclose(o.columnName)).reduce("", (acc, item) => acc ? acc + "," + item : item );
        const insertQuery = `INSERT INTO ${this.getEntityQueryString(insertExp.entity)}(${colString}) VALUES`;
        let queryCommand: IQuery = {
            query: insertQuery,
            parameters: {},
            type: QueryType.DML
        };
        const result: IQuery[] = [queryCommand];
        let parameterKeys: string[] = [];
        let isLimitExceed = false;
        insertExp.values.each(o => {
            if (this.queryLimit.maxParameters) {
                const curParamKeys = o.select(o => this.parameters.first(p => p.parameter === o)).where(o => !!o).select(o => o.name);
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
            queryCommand.query += `${this.newLine(1, true)}(${o.select(o => o ? this.getExpressionString(o) : "DEFAULT").toArray().join(",")}),`;
        });

        return result;
    }

    // Delete
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
            const set: { [key in keyof T]?: IExpression<any> } = {};
            set[deleteExp.entity.deleteColumn.propertyName] = new ValueExpression(true);
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
                child.addJoinRelation(deleteExp.select, o.reverseRelation);
                switch (deleteOption) {
                    case "CASCADE": {
                        const childDelete = new DeleteExpression(child, deleteExp.deleteMode);
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
                this.getEntityJoinString(deleteExp.entity, deleteExp.joins);
            if (deleteExp.where)
                selectQuery += this.newLine() + "WHERE " + this.getOperandString(deleteExp.where);
            result.push({
                query: selectQuery,
                parameters: this.getParameter(deleteExp),
                type: QueryType.DML
            });
        }

        const clone = deleteExp.clone();
        const includedDeletes = deleteExp.includes.selectMany(o => {
            const child = o.child.clone();
            const relationMap = new Map();
            for (const [parentCol, childCol] of o.relations) {
                const cloneCol = clone.entity.columns.first(c => c.columnName === parentCol.columnName);
                const cloneChildCol = child.entity.columns.first(c => c.columnName === childCol.columnName);
                relationMap.set(cloneCol, cloneChildCol);
            }
            child.addJoinRelation(clone.select, relationMap, JoinType.INNER);
            if (clone.select.where) {
                child.addWhere(clone.select.where);
                clone.select.where = null;
            }
            return this.getBulkDeleteQuery(child);
        }).toArray();
        result = result.concat(includedDeletes);

        return result;
    }
    // update
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
            this.getEntityJoinString(update.entity, update.joins);
        if (update.where)
            updateQuery += this.newLine() + "WHERE " + this.getOperandString(update.where);

        result.push({
            query: updateQuery,
            parameters: this.getParameter(update),
            type: QueryType.DML
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

    protected getValueExpressionString(expression: ValueExpression<any>): string {
        return this.getValueString(expression.value);
    }
    public getValueString(value: any): string {
        switch (typeof value) {
            case "number":
                return this.getNumberString(value);
            case "boolean":
                return this.getBooleanString(value);
            case "undefined":
                return this.getNullString();
            case "string":
                return this.getString(value);
            default:
                if (value === null)
                    return this.getNullString();
                else if (value instanceof Date)
                    return this.getDateTimeString(value);

                throw new Error("type not supported");
        }
    }
    protected getDateTimeString(value: Date): string {
        return this.getString(value.getFullYear() + "-" + fillZero(value.getMonth() + 1) + "-" + fillZero(value.getDate()) + " " +
            fillZero(value.getHours()) + ":" + fillZero(value.getMinutes()) + ":" + fillZero(value.getSeconds()));
    }
    protected getNullString() {
        return "NULL";
    }
    public getString(value: string) {
        return "'" + this.escapeString(value) + "'";
    }
    protected escapeString(value: string) {
        return value.replace(/'/ig, "''");
    }
    protected getBooleanString(value: boolean) {
        return value ? "1" : "0";
    }
    protected getNumberString(value: number) {
        return value.toString();
    }

    //#endregion

    //#region IExpression

    public getExpressionString<T = any>(expression: IExpression<T>): string {
        if (expression instanceof SelectExpression) {
            return this.getSelectQueryString(expression) + ";";
        }
        else if (expression instanceof ColumnExpression || expression instanceof ComputedColumnExpression) {
            return this.getColumnString(expression);
        }
        else if (expression instanceof EntityExpression || expression instanceof ProjectionEntityExpression) {
            return this.getEntityQueryString(expression);
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
                    result = this.getValueExpressionString(expression as any);
                    break;
                default:
                    throw new Error(`Expression ${expression.toString()} not supported`);
            }
            return result;
        }
    }
    protected getOperatorString(expression: IBinaryOperatorExpression) {
        const translator = this.resolveTranslator(expression.constructor);
        if (!translator) {
            throw new Error(`operator "${expression.constructor.name}" not supported`);
        }
        return translator.translate(expression, this);
    }
    public getLogicalOperandString(expression: IExpression<boolean>) {
        if (expression instanceof ColumnExpression || expression instanceof ComputedColumnExpression) {
            expression = new EqualExpression(expression, new ValueExpression(true));
        }
        return this.getExpressionString(expression);
    }
    protected getColumnString(column: IColumnExpression) {
        if (column instanceof ComputedColumnExpression) {
            return this.enclose(column.columnName);
        }
        return this.enclose(column.entity.alias) + "." + this.enclose(column.columnName);
    }
    protected getJoinColumnString(entity: IEntityExpression, column: IColumnExpression) {
        if (column instanceof ComputedColumnExpression) {
            return this.getOperandString(column.expression, true);
        }
        return this.enclose(entity.alias) + "." + this.enclose(column.columnName);
    }
    protected getColumnSelectString(column: IColumnExpression): string {
        if (column instanceof EmbeddedColumnExpression) {
            return column.selects.select(o => this.getColumnSelectString(o)).toArray().join(",");
        }
        let result = this.getColumnDefinitionString(column);
        if (column instanceof ComputedColumnExpression) {
            result += " AS " + this.enclose(column.columnName);
        }
        return result;
    }
    protected getColumnDefinitionString(column: IColumnExpression): string {
        if (column instanceof ComputedColumnExpression) {
            return this.getOperandString(column.expression, true);
        }
        else if (column instanceof EmbeddedColumnExpression) {
            return column.selects.select(o => this.getColumnDefinitionString(o)).toArray().join(",");
        }
        return this.enclose(column.entity.alias) + "." + this.enclose(column.columnName);
    }
    protected getSelectQueryString(select: SelectExpression): string {
        return this.getSelectQuery(select).select(o => o.query).toArray().join(";" + this.newLine() + this.newLine());
    }
    protected getPagingQueryString(select: SelectExpression, take: number, skip: number): string {
        let result = "";
        if (take > 0)
            result += "LIMIT " + take + " ";
        result += "OFFSET " + skip;
        return result;
    }
    protected getEntityJoinString<T>(entity: IEntityExpression<T>, joins: IJoinRelation<T, any>[]): string {
        let result = "";
        if (joins.length > 0) {
            result += this.newLine();
            result += joins.select(o => {
                let childEntString = "";
                if (o.child.isSimple())
                    childEntString = this.getEntityQueryString(o.child.entity);
                else
                    childEntString = "(" + this.newLine(1) + this.getSelectQueryString(o.child) + this.newLine(-1) + ") AS " + o.child.entity.alias;
                let join = o.type + " JOIN " + childEntString +
                    this.newLine(1, false) + "ON ";

                const jstr: string[] = [];
                for (const [key, val] of o.relations) {
                    jstr.push(this.getJoinColumnString(key.entity, key) + " = " + this.getJoinColumnString(o.child.entity, val));
                }
                return join + jstr.join(" AND ");
            }).toArray().join(this.newLine());
        }
        return result;
    }
    protected getEntityQueryString(entity: IEntityExpression): string {
        if (entity instanceof IntersectExpression) {
            return "(" + this.newLine(1) + "(" + this.newLine(1) + this.getSelectQueryString(entity.select) + this.newLine(-1) + ")" +
                this.newLine() + "INTERSECT" +
                this.newLine() + "(" + this.newLine(1) + this.getSelectQueryString(entity.select2) + this.newLine(-1) + ")" + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof UnionExpression) {
            let isUnionAll = false;
            if (entity.isUnionAll) {
                const isUnionAllParam = this.parameters.first(o => o.parameter.valueGetter === entity.isUnionAll);
                if (isUnionAllParam) {
                    isUnionAll = isUnionAllParam.value;
                }
            }
            return "(" + this.newLine(1) + "(" + this.newLine(1) + this.getSelectQueryString(entity.select) + this.newLine(-1) + ")" +
                this.newLine() + "UNION" + (isUnionAll ? " ALL" : "") +
                this.newLine() + "(" + this.newLine(1) + this.getSelectQueryString(entity.select2) + this.newLine(-1) + ")" + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof ExceptExpression) {
            return "(" + this.newLine(+1) + "(" + this.newLine(+1) + this.getSelectQueryString(entity.select) + this.newLine(-1) + ")" +
                this.newLine() + "EXCEPT" +
                this.newLine() + "(" + this.newLine(+1) + this.getSelectQueryString(entity.select2) + this.newLine(-1) + ")" + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof ProjectionEntityExpression) {
            return "(" + this.newLine(1) + this.getSelectQueryString(entity.subSelect) + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        return this.enclose(entity.name) + (entity.alias ? " AS " + this.enclose(entity.alias) : "");
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
        if (!translater) {
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
            translator = this.resolveTranslator(SelectExpression.prototype, expression.methodName);
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
                return this.getNullString();
            }
            return "@" + paramValue.name;
        }
        return "@" + expression.name;
    }
    public getOperandString(expression: IExpression, convertBoolean = false): string {
        if (expression instanceof EntityExpression || expression instanceof ProjectionEntityExpression) {
            const column = expression.primaryColumns.length > 0 ? expression.primaryColumns[0] : expression.columns[0];
            return this.getColumnString(column);
        }
        else if (convertBoolean && expression.type === Boolean && !(expression instanceof ValueExpression) && !(expression as IColumnExpression).entity) {
            expression = new TernaryExpression(expression, new ValueExpression(true), new ValueExpression(false));
        }

        return this.getExpressionString(expression);
    }

    //#endregion
}
