import "reflect-metadata";
import { ExpressionTransformer } from "../ExpressionBuilder/ExpressionTransformer";
import { TransformerParameter } from "../ExpressionBuilder/TransformerParameter";
import { NamingStrategy } from "./NamingStrategy";
import { EntityExpression } from "../Queryable/QueryExpression/EntityExpression";
import { GroupByExpression } from "../Queryable/QueryExpression/GroupByExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { SelectExpression, IJoinRelation } from "../Queryable/QueryExpression/SelectExpression";
import { UnionExpression } from "../Queryable/QueryExpression/UnionExpression";
import { IQueryVisitParameter, QueryExpressionVisitor } from "./QueryExpressionVisitor";
import { fillZero, isNotNull } from "../Helper/Util";
import { JoinType, ValueType, GenericType, QueryType } from "../Common/Type";
import { IdentifierColumnMetaData } from "../MetaData/IdentifierColumnMetaData";
import { ColumnType, ColumnTypeMapKey, ColumnGroupType } from "../Common/ColumnType";
import { IColumnTypeDefaults } from "../Common/IColumnTypeDefaults";
import { Enumerable } from "../Enumerable/Enumerable";
import { CustomEntityExpression } from "../Queryable/QueryExpression/CustomEntityExpression";
import { columnMetaKey, entityMetaKey } from "../Decorator/DecoratorKey";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { IQueryCommand } from "./Interface/IQueryCommand";
import { EntityEntry } from "../Data/EntityEntry";
import { EntityState } from "../Data/EntityState";
import { RelationEntry } from "../Data/RelationEntry";
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
import { NumericColumnMetaData } from "../MetaData/NumericColumnMetaData";
import { IEntityExpression } from "../Queryable/QueryExpression/IEntityExpression";
import { IntersectExpression } from "../Queryable/QueryExpression/IntersectExpression";
import { ExceptExpression } from "../Queryable/QueryExpression/ExceptExpression";
import { ColumnMetaData } from "../MetaData/ColumnMetaData";
import { RawSqlExpression } from "../Queryable/QueryExpression/RawSqlExpression";
import { defaultQueryTranslator } from "./QueryTranslator/DefaultQueryTranslator";
import { IQueryTranslatorItem } from "./QueryTranslator/IQueryTranslatorItem";
import { ParameterBuilder } from "./ParameterBuilder/ParameterBuilder";
import { IQueryOption } from "./Interface/ISelectQueryOption";
import { RowVersionColumnMetaData } from "../MetaData/RowVersionColumnMetaData";

export abstract class QueryBuilder extends ExpressionTransformer {
    public resolveTranslator(object: any, memberName?: string) {
        return defaultQueryTranslator.resolve(object, memberName);
    }
    public options: IQueryOption;
    public getParameterBuilder(): ParameterBuilder {
        return new ParameterBuilder(this.queryVisitor.sqlParameterBuilderItems);
    }
    public get scopeParameters(): TransformerParameter {
        return this.queryVisitor.scopeParameters;
    }
    public getLogicalOperandString(expression: IExpression<boolean>) {
        if (expression instanceof ColumnExpression || expression instanceof ComputedColumnExpression) {
            expression = new EqualExpression(expression, new ValueExpression(true));
        }
        return this.getExpressionString(expression);
    }
    public namingStrategy: NamingStrategy = new NamingStrategy();
    protected queryVisitor: QueryExpressionVisitor = new QueryExpressionVisitor(this);
    protected indent = 0;
    public newAlias(type?: "entity" | "column" | "param") {
        return this.queryVisitor.newAlias(type);
    }
    public enclose(identity: string) {
        if (this.namingStrategy.enableEscape && identity[0] !== "@" && identity[0] !== "#")
            return "\"" + identity + "\"";
        else
            return identity;
    }
    public visit(expression: IExpression, param: IQueryVisitParameter): IExpression {
        return this.queryVisitor.visit(expression, param);
    }
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
    protected getPagingQueryString(select: SelectExpression): string {
        let take = 0, skip = 0;
        if (select.paging.take)
            take = select.paging.take.execute(this.queryVisitor.expressionTransformer);
        if (select.paging.skip)
            skip = select.paging.skip.execute(this.queryVisitor.expressionTransformer);
        let result = "";
        if (take > 0)
            result += "LIMIT " + take + " ";
        result += "OFFSET " + skip;
        return result;
    }
    public abstract supportedColumnTypes: Map<ColumnType, ColumnGroupType>;
    public abstract columnTypesWithOption: ColumnType[];
    public abstract columnTypeDefaults: Map<ColumnType, IColumnTypeDefaults>;
    public abstract columnTypeMap: Map<ColumnTypeMapKey, ColumnType>;
    public abstract valueTypeMap: Map<GenericType, ColumnType>;
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
    public newLine(indent = 0, isAdd = true) {
        indent += this.indent;
        if (isAdd) {
            this.indent = indent;
        }
        return "\n" + (Array(indent + 1).join("\t"));
    }
    protected getEntityQueryString(entity: IEntityExpression): string {
        if (entity instanceof IntersectExpression) {
            return "(" + this.newLine(1) + "(" + this.newLine(1) + this.getSelectQueryString(entity.select) + this.newLine(-1) + ")" +
                this.newLine() + "INTERSECT" +
                this.newLine() + "(" + this.newLine(1) + this.getSelectQueryString(entity.select2) + this.newLine(-1) + ")" + this.newLine(-1) + ") AS " + this.enclose(entity.alias);
        }
        else if (entity instanceof UnionExpression) {
            return "(" + this.newLine(1) + "(" + this.newLine(1) + this.getSelectQueryString(entity.select) + this.newLine(-1) + ")" +
                this.newLine() + "UNION" + (entity.isUnionAll ? " ALL" : "") +
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
    public entityName(entityMeta: IEntityMetaData<any>) {
        return `${entityMeta.schema ? this.enclose(entityMeta.schema) + "." : ""}${this.enclose(entityMeta.name)}`;
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
        if (this.options.parameters) {
            const value = this.options.parameters[expression.name];
            if (!isNotNull(value)) {
                return this.getNullString();
            }
        }
        return "@" + expression.name;
    }
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
        return "CAST(" + (value ? "1" : "0") + " AS BIT)";
    }
    protected getNumberString(value: number) {
        return value.toString();
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
    public getSelectQuery<T>(select: SelectExpression<T>): IQueryCommand[] {
        let result: IQueryCommand[] = [];
        const hasIncludes = select.includes.length > 0;
        let take = 0, skip = 0;
        if (select.paging.take)
            take = select.paging.take.execute(this.queryVisitor.expressionTransformer);
        if (select.paging.skip)
            skip = select.paging.skip.execute(this.queryVisitor.expressionTransformer);
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
            selectQuery += this.newLine() + this.getPagingQueryString(select);
        }

        if (hasIncludes) {
            selectQuery = `${this.newLine(-1, true)})`;
        }

        result.push({
            query: selectQuery,
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
    public updateQueries<T>(select: SelectExpression<T>, parameters: { [key: string]: any }, set: { [key: string]: ValueType | IExpression<any> }): IQueryCommand[] {
        let result: IQueryCommand[] = [];
        const setQuery = Object.keys(set).select(o => {
            const value = set[o];
            const valueStr = (value as IExpression).type ? this.getExpressionString(value as IExpression) : this.getValueString(value);
            return `${select.entity.alias}.${o} = ${valueStr}`;
        }).toArray().join(", ");
        let updateQuery = `UPDATE ${this.enclose(select.entity.alias)}` +
            this.newLine() + `SET ${setQuery}` +
            this.newLine() + `FROM ${this.enclose(select.entity.name)} ${this.enclose(select.entity.alias)} ` +
            this.getEntityJoinString(select.entity, select.joins);
        if (select.where)
            updateQuery += this.newLine() + "WHERE " + this.getOperandString(select.where);

        result.push({
            query: updateQuery,
            parameters: parameters,
            type: QueryType.DML
        });

        return result;
    }
    public deleteQueries<T>(select: SelectExpression<T>, parameters: { [key: string]: any }, isHardDelete = false): IQueryCommand[] {
        let result: IQueryCommand[] = [];
        if (!isHardDelete)
            isHardDelete = !select.entity.deleteColumn;

        // remove all entity related to this one.
        const entityMeta: IEntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, select.entity.type);
        const relations = entityMeta.relations.where(o => o.isMaster);
        result = result.concat(relations.selectMany(o => {
            let child = new SelectExpression(new EntityExpression(o.target.type, this.newAlias()));
            child.addJoinRelation(select, o.reverseRelation);
            return this.deleteQueries(select, parameters, isHardDelete);
        }).toArray());

        if (!isHardDelete) {
            // if soft delete, set delete column to true
            const set: { [key: string]: any } = {};
            set[select.entity.deleteColumn.columnName] = true;

            return this.updateQueries(select, parameters, set);
        }
        else {
            let selectQuery = `DELETE ${this.enclose(select.entity.alias)}` +
                this.newLine() + `FROM ${this.enclose(select.entity.name)} ${this.enclose(select.entity.alias)} ` +
                this.getEntityJoinString(select.entity, select.joins);
            if (select.where)
                selectQuery += this.newLine() + "WHERE " + this.getOperandString(select.where);
            result.push({
                query: selectQuery,
                parameters: parameters,
                type: QueryType.DML
            });
        }

        return result;
    }
    public lastInsertedIdentity() {
        return "LAST_INSERT_ID()";
    }
    public getInsertQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Array<EntityEntry<T>> | Enumerable<EntityEntry<T>>): IQueryCommand[] {
        const results: IQueryCommand[] = [];

        const columns = entityMetaData.columns;
        const relations = entityMetaData.relations
            .where(o => !o.nullable && !o.isMaster && o.relationType === "one");
        const relationDatas = relations.selectMany(o => o.relationColumns.select(c => ({
            column: c,
            relationProperty: o.propertyName,
            fullName: o.fullName,
            relationColumn: o.relationMaps.get(c)
        })));
        const relationColumns = relationDatas.select(o => o.column);
        const valueColumns = columns.except(relationColumns).where(o => !(o instanceof IdentifierColumnMetaData || o.isCreatedDate || o.isDeleteColumn || o.isModifiedDate || (o instanceof NumericColumnMetaData && o.autoIncrement) || o instanceof RowVersionColumnMetaData));
        const columnNames = relationDatas.select(o => o.column).union(valueColumns).select(o => this.enclose(o.columnName)).toArray().join(", ");

        const getEntryValues = (entry: EntityEntry<T>, insertQuery: IQueryCommand, selectQuery: IQueryCommand, wheres: string[]) => {
            const res = relationDatas.select(o => {
                // set relation as unchanged (coz already handled here)
                const parentEntity = entry.entity[o.relationProperty] as any;
                if (!parentEntity) {
                    throw new Error(`${o.relationProperty} cannot be null`);
                }

                // TODO: need revisit. coz should not change any state before all data has been saved.
                // Don't set relation entry to unchanged, but filter logic should be implemented on relation add.
                const parentEntry = entry.dbSet.dbContext.entry(parentEntity);
                if (parentEntry) {
                    const relationGroup = entry.relationMap[o.fullName];
                    if (relationGroup) {
                        const relationEntry = relationGroup.get(parentEntry.key);
                        if (relationEntry)
                            relationEntry.changeState(EntityState.Unchanged);
                    }
                }

                let paramName = "";
                let value: any = undefined;
                if (parentEntry.state === EntityState.Added) {
                    // if parent entry is added, to used inserted values in case column is auto increment or use default.
                    const index = parentEntry.dbSet.dbContext.entityEntries.add.get(parentEntry.dbSet.metaData).indexOf(parentEntry);
                    paramName = `__${parentEntry.dbSet.metaData.name}_${o.relationColumn.columnName}_${index}`;
                }
                else {
                    value = parentEntity[o.relationColumn.propertyName];
                    paramName = this.newAlias("param");
                }

                insertQuery.parameters[paramName] = value;
                if (o.column.isPrimaryColumn) {
                    wheres.push(`${this.enclose(o.column.columnName)} = @${paramName}`);
                    selectQuery.parameters[paramName] = value;
                }
                return "@" + paramName;
            }).union(valueColumns.select(o => {
                let value = entry.entity[o.propertyName as keyof T];
                if (value === undefined) {
                    if (o.default)
                        return "DEFAULT";
                    return "NULL";
                }
                else {
                    const paramName = this.newAlias("param");
                    insertQuery.parameters[paramName] = value;

                    if (o.isPrimaryColumn) {
                        wheres.push(`${this.enclose(o.columnName)} = @${paramName}`);
                        selectQuery.parameters[paramName] = value;
                    }

                    return "@" + paramName;
                }
            })).toArray().join(",");

            return res;
        };


        let generatedColumns = entityMetaData.insertGeneratedColumns.asEnumerable();
        // columns.where(o => {
        //     return o.default !== undefined || (o as any as NumericColumnMetaData).autoIncrement || o instanceof RowVersionColumnMetaData;
        // });

        if (generatedColumns.any()) {
            generatedColumns = entityMetaData.primaryKeys.union(generatedColumns);
        }

        if (entityMetaData.hasIncrementPrimary) {
            // if primary key is auto increment, then need to split all query per entry.
            const incrementColumn = entityMetaData.primaryKeys.first(o => (o as any as NumericColumnMetaData).autoIncrement);

            for (const entry of entries) {
                const insertQuery: IQueryCommand = {
                    query: "",
                    parameters: {},
                    type: QueryType.DML
                };
                const selectQuery: IQueryCommand = {
                    query: "",
                    parameters: {},
                    type: QueryType.DQL
                };
                const wheres: string[] = [];
                insertQuery.query = `INSERT INTO ${this.entityName(entityMetaData)}(${columnNames})` +
                    ` VALUES (${getEntryValues(entry, insertQuery, selectQuery, wheres)})`;
                results.push(insertQuery);

                if (generatedColumns.any()) {
                    // get all inserted value to map all auto generated or default value to model.
                    wheres.push(`${this.enclose(incrementColumn.columnName)} = ${this.lastInsertedIdentity()}`);
                    selectQuery.query = `SELECT ${generatedColumns.select(o => o.columnName).toArray().join(",")} FROM ${this.entityName(entityMetaData)} WHERE (${wheres.join(" AND ")})`;
                    results.push(selectQuery);
                }
            }
        }
        else {
            const insertQuery: IQueryCommand = {
                query: "",
                parameters: {},
                type: QueryType.DML
            };
            const selectQuery: IQueryCommand = {
                query: "",
                parameters: {},
                type: QueryType.DQL
            };
            let selectWheres: string[] = [];

            insertQuery.query = `INSERT INTO ${this.entityName(entityMetaData)}(${columnNames}) VALUES `;
            insertQuery.query += entries.select(entry => {
                const wheres: string[] = [];
                const res = "(" + getEntryValues(entry, insertQuery, selectQuery, wheres) + ")";
                selectWheres.push(wheres.join(" AND "));
                return res;
            }).toArray().join(",");

            results.push(insertQuery);

            if (generatedColumns.any()) {
                // get all inserted value to map all auto generated or default value to model.
                selectQuery.query = `SELECT ${generatedColumns.select(o => o.columnName).toArray().join(",")} FROM ${this.entityName(entityMetaData)} WHERE (${selectWheres.join(") OR (")})`;
                results.push(selectQuery);
            }
        }

        return results;
    }
    public getUpdateQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Array<EntityEntry<T>> | Enumerable<EntityEntry<T>>): IQueryCommand[] {
        let autoUpdateColumns = entityMetaData.updateGeneratedColumns.asEnumerable();
        if (autoUpdateColumns.any()) {
            autoUpdateColumns = entityMetaData.primaryKeys.union(autoUpdateColumns);
        }
        // entityMetaData.columns.where(o => o.isModifiedDate && o instanceof RowVersionColumnMetaData).toArray();
        const primaryKeyParams: { [key: string]: any } = {};
        const wheres: string[] = [];
        const result = entries.select(entry => {
            const modifiedColumns = entry.getModifiedProperties().select(o => ({
                propertyName: o,
                metaData: Reflect.getMetadata(columnMetaKey, entityMetaData.type, o) as ColumnMetaData
            }));

            const updateQuery: IQueryCommand = {
                query: "",
                parameters: {},
                type: QueryType.DML
            };
            let set = modifiedColumns.select(o => {
                const paramName = this.newAlias("param");
                updateQuery.parameters[paramName] = entry.entity[o.propertyName as keyof T];
                return `${this.enclose(o.metaData.columnName)} = @${paramName}`;
            }).toArray().join(",\n");

            // TODO: cannot use literal CURRENT_TIMESTAMP
            if (entry.metaData.modifiedDateColumn) {
                set += `,\n${entry.metaData.modifiedDateColumn.columnName} = CURRENT_TIMESTAMP`;
            }

            let where = entityMetaData.primaryKeys.select(o => {
                const paramName = this.newAlias("param");
                updateQuery.parameters[paramName] = entry.entity[o.propertyName];
                if (hasUpdateColumn)
                    primaryKeyParams[paramName] = entry.entity[o.propertyName];
                return this.enclose(o.columnName) + " = @" + paramName;
            }).toArray().join(" AND ");

            if (hasUpdateColumn)
                wheres.push(where);

            let concurencyFilter = "";
            switch (entityMetaData.concurrencyMode) {
                case "OPTIMISTIC VERSION": {
                    let versionCol = entityMetaData.columns.first(o => o instanceof RowVersionColumnMetaData);
                    if (!versionCol) {
                        versionCol = entityMetaData.modifiedDateColumn;
                    }

                    const paramName = this.newAlias("param");
                    updateQuery.parameters[paramName] = entry.entity[versionCol.propertyName];
                    concurencyFilter = `${versionCol.columnName} = @${paramName}`;
                    break;
                }
                case "OPTIMISTIC DIRTY": {
                    concurencyFilter = modifiedColumns.select(o => {
                        const paramName = this.newAlias("param");
                        updateQuery.parameters[paramName] = entry.getOriginalValue(o.propertyName);
                        return `${o.propertyName} = @${paramName}`;
                    }).toArray().join(" AND ");
                    break;
                }
            }
            where += `${where ? " AND " : ""}(${concurencyFilter})`;

            updateQuery.query = `UPDATE ${this.entityName(entityMetaData)} SET ${set} WHERE ${where}`;

            // TODO
            // select all columns that has it's value generated by db.
            if (autoUpdateColumns.length > 0) {
                const selectQuery: IQueryCommand = {
                    query: "",
                    parameters: {},
                    type: QueryType.DQL
                };
                selectQuery.query = ``;
            }

            return updateQuery;
        }).toArray();

        return result;
    }
    public getDeleteQueries<T>(entityMetaData: IEntityMetaData<T>, entries: Array<EntityEntry<T>>, forceHardDelete?: boolean): IQueryCommand[] {
        if (entries.length <= 0)
            return null;

        const deleteExp = new SelectExpression(new EntityExpression(entityMetaData.type, this.newAlias()));
        const parameters: { [key: string]: any } = {};
        let condition = "";
        if (entityMetaData.primaryKeys.length === 1) {
            const primaryCol = entityMetaData.primaryKeys.first();
            const primaryValues = entries.select(o => {
                const paramName = this.newAlias("param");
                parameters[paramName] = o.entity[primaryCol.propertyName];
                return `@${paramName}`;
            }).toArray().join(",");
            condition = `${primaryCol.propertyName} IN (${primaryValues})`;
        }
        else {
            condition = entries.select(o => {
                const keyCompare = entityMetaData.primaryKeys.select(pk => {
                    const paramName = this.newAlias("param");
                    parameters[paramName] = o.entity[pk.propertyName];
                    return `${pk.columnName} = @${paramName}`;
                }).toArray().join(" AND ");
                return `(${keyCompare})`;
            }).toArray().join(" OR ");
        }
        deleteExp.addWhere(new RawSqlExpression<boolean>(Boolean, condition));
        return this.deleteQueries(deleteExp, parameters, forceHardDelete);
    }
    public getRelationAddQueries<T, T2, TData>(slaveEntityMetaData: IEntityMetaData<T>, relationEntries: Array<RelationEntry<T, T2, TData>> | Enumerable<RelationEntry<T, T2, TData>>): IQueryCommand[] {
        return relationEntries.selectMany(relationEntry => {
            const results: IQueryCommand[] = [];

            const isMasterAdded = relationEntry.masterEntry.state === EntityState.Added;
            if (relationEntry.slaveRelation.relationType === "one") {
                const parameters: { [key: string]: any } = {};
                const set = relationEntry.slaveRelation.relationColumns.select(o => {
                    let paramName = "";
                    let value: any;
                    if (isMasterAdded) {
                        // if parent entry is added, to used inserted values in case column is auto increment or use default.
                        const index = relationEntry.masterEntry.dbSet.dbContext.entityEntries.add.get(relationEntry.masterEntry.dbSet.metaData).indexOf(relationEntry.masterEntry);
                        paramName = `__${relationEntry.masterEntry.dbSet.metaData.name}_${o.columnName}_${index}`;
                    }
                    else {
                        const reverseProperty = relationEntry.slaveRelation.relationMaps.get(o).propertyName;
                        value = relationEntry.masterEntry.entity[reverseProperty as keyof T2];
                        paramName = this.newAlias("param");
                    }
                    parameters[paramName] = value;

                    return `${this.enclose(o.columnName)} = @${paramName}`;
                }).toArray().join(",\n");
                const where = slaveEntityMetaData.primaryKeys.select(o => {
                    const paramName = this.newAlias("param");
                    parameters[paramName] = relationEntry.slaveEntry.entity[o.propertyName];
                    return this.enclose(o.columnName) + " = @" + paramName;
                }).toArray().join(" AND ");

                results.push({
                    query: `UPDATE ${slaveEntityMetaData.name} SET ${set} WHERE ${where}`,
                    parameters: parameters,
                    type: QueryType.DML
                });
            }
            else {
                const parameters: { [key: string]: any } = {};
                const relationDataMeta = relationEntry.slaveRelation.relationData;
                const columnNames = relationDataMeta.sourceRelationColumns.union(relationDataMeta.targetRelationColumns)
                    .select(o => o.columnName).toArray().join(",");
                const values = relationDataMeta.sourceRelationColumns.select(o => {
                    let paramName = "";
                    let value: any;
                    const sourceCol = relationDataMeta.sourceRelationMaps.get(o);
                    if (isMasterAdded) {
                        // if parent entry is added, to used inserted values in case column is auto increment or use default.
                        const index = relationEntry.masterEntry.dbSet.dbContext.entityEntries.add.get(relationEntry.masterEntry.dbSet.metaData).indexOf(relationEntry.masterEntry);
                        paramName = `__${relationEntry.masterEntry.dbSet.metaData.name}_${sourceCol.columnName}_${index}`;
                    }
                    else {
                        const relProperty = sourceCol.propertyName as keyof T2;
                        value = relationEntry.masterEntry.entity[relProperty];
                        paramName = this.newAlias("param");
                    }

                    parameters[paramName] = value;
                    return "@" + paramName;
                }).union(relationDataMeta.targetRelationColumns.except(relationDataMeta.sourceRelationColumns).select(o => {
                    let paramName = "";
                    let value: any;
                    const targetCol = relationDataMeta.targetRelationMaps.get(o);
                    if (isMasterAdded) {
                        // if parent entry is added, to used inserted values in case column is auto increment or use default.
                        const index = relationEntry.slaveEntry.dbSet.dbContext.entityEntries.add.get(relationEntry.slaveEntry.dbSet.metaData).indexOf(relationEntry.slaveEntry);
                        paramName = `__${relationEntry.masterEntry.dbSet.metaData.name}_${targetCol.columnName}_${index}`;
                    }
                    else {
                        const relProperty = targetCol.propertyName as keyof T;
                        value = relationEntry.slaveEntry.entity[relProperty];
                        paramName = this.newAlias("param");
                    }

                    parameters.set[paramName] = value;
                    return "@" + paramName;
                })).toArray().join(",");

                results.push({
                    query: `INSERT INTO ${this.enclose(relationDataMeta.name)}(${columnNames}) VALUES (${values})`,
                    parameters: parameters,
                    type: QueryType.DML
                });
            }
            return results;
        }).toArray();
    }
    public getRelationDeleteQueries<T, T2, TData>(entityMetaData: IEntityMetaData<T>, relationEntries: Array<RelationEntry<T, T2, TData>> | Enumerable<RelationEntry<T, T2, TData>>): IQueryCommand[] {
        return relationEntries.selectMany((relationEntry) => {
            const relations = relationEntry.slaveEntry.relationMap[relationEntry.slaveRelation.fullName];
            if (relationEntry.slaveRelation.relationType === "one") {
                // if there is existing same relation but not deleted, then no need delete.
                // don't re delete FK for the same relation. only execute first.
                const relationKeys = Object.keys(relations);
                if (relations.get(relationKeys.first()) !== relationEntry || relationKeys.any(o => relations.get(o).state !== EntityState.Deleted)) {
                    return [];
                }

                if (relationEntry.slaveRelation.nullable) {
                    // Set foreignkey to null query.
                    const set = relationEntry.slaveRelation.relationColumns.select(o =>
                        `${this.enclose(o.columnName)} = NULL`
                    ).toArray().join(",\n");
                    const parameters: { [key: string]: any } = {};
                    const where = entityMetaData.primaryKeys.select(o => {
                        const paramName = this.newAlias("param");
                        parameters[paramName] = relationEntry.slaveEntry.entity[o.propertyName];
                        return this.enclose(o.columnName) + " = @" + paramName;
                    }).toArray().join(" AND ");
                    return [{
                        query: `UPDATE ${entityMetaData.name} SET ${set} WHERE ${where}`,
                        parameters: parameters
                    }] as IQueryCommand[];
                }
                else {
                    // if not nullable, then delete slave entity.
                    return this.getDeleteQueries(relationEntry.slaveRelation.source, [relationEntry.slaveEntry]);
                }
            }
            else {
                // remove relation table.
                // after save remove all reference to this relation entry
                const parameter: { [key: string]: any } = {};
                const relationDataMeta = relationEntry.slaveRelation.relationData;
                const condition = relationDataMeta.sourceRelationColumns.select(o => {
                    const relProperty = relationDataMeta.sourceRelationMaps.get(o).propertyName as keyof T2;
                    const value = relationEntry.masterEntry.entity[relProperty];
                    const paramName = this.newAlias("param");
                    parameter.set[paramName] = value;
                    return this.enclose(o.columnName) + " = @" + paramName;
                }).union(relationDataMeta.targetRelationColumns.except(relationDataMeta.sourceRelationColumns).select(o => {
                    const relProperty = relationDataMeta.sourceRelationMaps.get(o).propertyName as keyof T;
                    const value = relationEntry.slaveEntry.entity[relProperty];
                    const paramName = this.newAlias("param");
                    parameter[paramName] = value;
                    return this.enclose(o.columnName) + " = @" + paramName;
                })).toArray().join(" AND ");

                return [{
                    query: `DELETE FROM ${this.enclose(entityMetaData.name)} WHERE ${condition}`,
                    parameters: parameter,
                    type: QueryType.DML
                }] as IQueryCommand[];
            }
        }).toArray();
    }

    /**
     * SCHEMA BUILDER QUERY
     */
}
