import { QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType, IObjectType, SetterObj } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { isColumnExp, isNotNull, isNull } from "../../Helper/Util";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { IQuery } from "../../Query/IQuery";
import { IQueryBuilderContext } from "../../Query/IQueryBuilderContext";
import { IQueryOption } from "../../Query/IQueryOption";
import { ISqlParameterValueMap } from "../../Query/IQueryParameter";
import { ColumnExpression } from "../../Queryable/QueryExpression/ColumnExpression";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { SqlParameterExpression } from "../../Queryable/QueryExpression/SqlParameterExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { MssqlColumnType } from "./MssqlColumnType";
import { mssqlQueryTranslator } from "./MssqlQueryTranslator";
import { Enumerable } from "@elcy/enumerable";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { IEntityExpression } from "src/Queryable/QueryExpression/IEntityExpression";
import { TernaryExpression } from "src/ExpressionBuilder/Expression/TernaryExpression";
import { AndExpression } from "src/ExpressionBuilder/Expression/AndExpression";
import { OrExpression } from "src/ExpressionBuilder/Expression/OrExpression";
import { EqualExpression } from "src/ExpressionBuilder/Expression/EqualExpression";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { NotEqualExpression } from "src/ExpressionBuilder/Expression/NotEqualExpression";
import { NotExpression } from "src/ExpressionBuilder/Expression/NotExpression";
import { GreaterThanExpression } from "src/ExpressionBuilder/Expression/GreaterThanExpression";
import { GreaterEqualExpression } from "src/ExpressionBuilder/Expression/GreaterEqualExpression";
import { LessThanExpression } from "src/ExpressionBuilder/Expression/LessThanExpression";
import { LessEqualExpression } from "src/ExpressionBuilder/Expression/LessEqualExpression";
import { InstanceofExpression } from "src/ExpressionBuilder/Expression/InstanceofExpression";
import { StrictNotEqualExpression } from "src/ExpressionBuilder/Expression/StrictNotEqualExpression";
import { SqlTableValueParameterExpression } from "src/Queryable/QueryExpression/SqlTableValueParameterExpression";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";
import { ProjectionEntityExpression } from "src/Queryable/QueryExpression/ProjectionEntityExpression";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { DeleteExpression } from "src/Queryable/QueryExpression/DeleteExpression";

export class MssqlQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 2100,
        maxQueryLength: 67108864
    };
    public override translator = mssqlQueryTranslator;
    public valueTypeMap = new Map<GenericType, (value?: unknown) => ICompleteColumnType<MssqlColumnType>>([
        [Uuid, () => ({ columnType: "uniqueidentifier", group: "Identifier" })],
        [BigInt, () => ({ columnType: "bigint", group: "BigInt" })],
        [TimeSpan, () => ({ columnType: "time", group: "Time" })],
        [Date, () => ({ columnType: "datetime", group: "DateTime" })],
        [String, (val: string) => ({ columnType: "nvarchar", group: "String", option: { length: 255 } })],
        [Number, () => ({ columnType: "decimal", group: "Decimal", option: { precision: 18, scale: 0 } })],
        [Boolean, () => ({ columnType: "bit", group: "Boolean" })]
    ]);
    public override encloseIdentifier(identity: string) {
        return `[${identity}]`;
    }

    //#region Update
    protected override getInsertQuery<TE extends object>(insertExp: InsertExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        if (insertExp.values.length <= 0) {
            return [];
        }

        const param: IQueryBuilderContext = {
            option: option,
            parameters: parameters,
            queryExpression: insertExp
        };
        let returning = "";
        if (insertExp.returnings.length) {
            const originalAlias = insertExp.entity.alias;
            insertExp.entity.alias = "INSERTED";
            returning = `${this.newLine()}OUTPUT ${insertExp.returnings.map(o => {
                let colStr = this.getColumnQueryString(o, param);
                // NOTE: computed column should always has alias
                if (o.alias) {
                    colStr += " AS " + this.enclose(o.alias);
                }

                return colStr;
            }).join(",")}`;
            insertExp.entity.alias = originalAlias;
        }

        const colString = insertExp.columns.map((o) => this.enclose(o.columnName)).join(", ");
        const insertQuery = `INSERT INTO ${this.entityName(insertExp.entity)}(${colString})${returning}` +
            `${this.newLine()}VALUES${this.newLine(1, false)}`;

        this.indent++;
        const rowValues: string[] = [];
        for (const itemExp of insertExp.values) {
            const values: string[] = [];
            for (const col of insertExp.columns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    values.push(this.toString(valueExp, param));
                }
                else {
                    values.push("DEFAULT");
                }
            }
            rowValues.push(`(${values.join(",")})`);
        }
        const result: IQuery[] = [{
            query: `${insertQuery}${rowValues.join(`,${this.newLine()}`)}`,
            parameters: this.getParameter(param),
            type: returning ? QueryType.DML | QueryType.DQL : QueryType.DML
        }];
        this.indent--;

        return result;
    }
    protected override getUpdateQuery<TE extends object>(updateExp: UpdateExpression<TE>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        const result: IQuery[] = [];
        const context = this.createContext(updateExp, parameters, option);

        const useTempTable = !option?.supportTVP && !updateExp.parentRelation && updateExp.includes.length;
        if (useTempTable) {
            for (const [key, valueExp] of parameters) {
                if (!(key instanceof SqlTableValueParameterExpression)) {
                    continue;
                }

                result.push(...this.createTempTableQuery(key, valueExp.value as unknown[], context));
            }
        }

        let returning = "";
        if (updateExp.returnings.length) {
            const originalAlias = updateExp.entity.alias;
            updateExp.entity.alias = "INSERTED";
            returning = `${this.newLine()}OUTPUT ${updateExp.returnings.map(o => {
                let colStr = this.getColumnQueryString(o, context);
                // NOTE: computed column should always has alias
                if (o.alias) {
                    colStr += " AS " + this.enclose(o.alias);
                }

                return colStr;
            }).join(",")}`;
            updateExp.entity.alias = originalAlias;
        }

        if (updateExp.paging?.skip) {
            const projectedEntity = new ProjectionEntityExpression(updateExp.select);
            projectedEntity.alias = updateExp.entity.alias + "_1";
            const selectExp = new SelectExpression(projectedEntity);

            let relation: IExpression<boolean>;
            for (const column of updateExp.entity.primaryColumns) {
                const selectColumn = projectedEntity.columns.find(o => o.propertyName == column.propertyName);
                const equalExp = new StrictEqualExpression(column, selectColumn);
                relation = relation ? new AndExpression(relation, equalExp) : equalExp;
            }

            const setQuery = selectExp.selects
                .map((o) => `${this.enclose(o.columnName)} = ${this.getColumnQueryString(o, context)}`)
                .join(", ");
            const updateQuery = `UPDATE ${this.enclose(updateExp.entity.alias)}` +
                this.newLine() + `SET ${setQuery}` +
                returning +
                this.newLine() + `FROM ${this.enclose(updateExp.entity.name)} AS ${this.enclose(updateExp.entity.alias)}` +
                this.getJoinQueryString([new JoinRelation(updateExp.select, selectExp, relation, "INNER")], context);
            result.push({
                query: updateQuery,
                parameters: this.getParameter(context),
                type: updateExp.returnings.length ? QueryType.DML | QueryType.DQL : QueryType.DML
            });
        }
        else {
            const setQuery = Object.keys(updateExp.setter).map((o) => {
                const value = updateExp.setter[o as keyof TE];
                const valueStr = this.toOperandString(value, context);
                const column = updateExp.entity.columns.find((c) => c.propertyName === o);
                return `${this.enclose(updateExp.entity.alias)}.${this.enclose(column.columnName)} = ${valueStr}`;
            });

            let limit = "";
            if (updateExp.paging?.take) {
                limit = ` TOP (${this.toString(updateExp.paging.take, context)})`;
            }
            let updateQuery = `UPDATE${limit} ${this.enclose(updateExp.entity.alias)}` +
                this.newLine() + `SET ${setQuery.join(", ")}` +
                returning +
                this.newLine() + `FROM ${this.enclose(updateExp.entity.name)} AS ${this.enclose(updateExp.entity.alias)}` +
                this.getJoinQueryString(updateExp.joins, context);
            if (updateExp.where) {
                updateQuery += this.newLine() + "WHERE " + this.toLogicalString(updateExp.where, context);
            }
            if (limit && updateExp.orders.length) {
                updateQuery += this.newLine() + `ORDER BY ${updateExp.orders.map((c) => this.toString(c.column, context) + " " + c.direction).join(", ")}`;
            }

            result.push({
                query: updateQuery,
                parameters: this.getParameter(context),
                type: updateExp.returnings.length ? QueryType.DML | QueryType.DQL : QueryType.DML
            });
        }

        const includedUpdates = updateExp.includes.flatMap((o) => this.getUpdateQuery(o.child, context.option, context.parameters));
        result.push(...includedUpdates);
        return result;
    }
    protected override getDeleteQuery<T extends object>(deleteExp: DeleteExpression<T>, option: IQueryOption, parameters: ISqlParameterValueMap): IQuery[] {
        let result: IQuery[] = [];
        const context = this.createContext(deleteExp, parameters, option);

        const useTempTable = !option?.supportTVP && !deleteExp.parentRelation && deleteExp.includes.length;
        if (useTempTable) {
            for (const [key, valueExp] of parameters) {
                if (!(key instanceof SqlTableValueParameterExpression)) {
                    continue;
                }

                result.push(...this.createTempTableQuery(key, valueExp.value as unknown[], context));
            }
        }

        let selectQuery = `DELETE ${this.enclose(deleteExp.entity.alias ?? deleteExp.entity.name)}` +
            this.newLine() + `FROM ${this.entityName(deleteExp.entity)}${(deleteExp.entity.alias ? " AS " + this.enclose(deleteExp.entity.alias) : "")}` +
            this.getJoinQueryString(deleteExp.joins, context) + this.getParentJoinQueryString(deleteExp.parentRelation, context);
        if (deleteExp.where) {
            selectQuery += this.newLine() + "WHERE " + this.toLogicalString(deleteExp.where, context);
        }
        result.push({
            query: selectQuery,
            type: QueryType.DML,
            parameters: this.getParameter(context)
        });

        const includedDeletes = deleteExp.includes.flatMap((o) => this.getDeleteQuery(o.child, context.option, context.parameters));
        result.push(...includedDeletes);
        return result;
    }
    //#endregion

    protected override getPagingQueryString<TE extends object>(sqlExp: SelectExpression<TE>, param?: IQueryBuilderContext): string {
        let result = "";
        if (sqlExp.orders.length <= 0) {
            if (sqlExp.distinct || sqlExp.isAggregated) {
                result += `${this.newLine()}ORDER BY ${this.toString(sqlExp.projectedColumns.find(o => true), param)}`;
            }
            else {
                result += `${this.newLine()}ORDER BY ${this.toString(sqlExp.entity.primaryColumns.find(o => true), param)}`;
            }
        }
        if (sqlExp.paging.skip) {
            result += `${this.newLine()}OFFSET ${this.toString(sqlExp.paging.skip, param)} ROWS`;
        }
        if (sqlExp.paging.take) {
            if (!sqlExp.paging.skip) {
                result += `${this.newLine()}OFFSET 0 ROWS`;
            }

            result += `${this.newLine()}FETCH NEXT ${this.toString(sqlExp.paging.take, param)} ROWS ONLY`;
        }
        return result;
    }

    public override toParameterValue(input: any, column: IColumnMetaData): any {
        if (isNull(input)) {
            return null;
        }
        if (column instanceof ColumnExpression && column.columnMeta instanceof RowVersionColumnMetaData) {
            return new Uint8Array(input.buffer ? input.buffer : input);
        }
        return super.toParameterValue(input, column);
    }
    public override toPropertyValue<T>(input: any, column: IColumnMetaData<any, T>): T {
        if (column instanceof RowVersionColumnMetaData) {
            return new (column.type as IObjectType<T>)(input.buffer ? input.buffer : input);
        }
        return super.toPropertyValue(input, column);
    }
    protected override booleanString(value: boolean) {
        return value ? "1" : "0";
    }
    protected override getParameter(param: IQueryBuilderContext) {
        const paramObj = new Map<string, any>();
        let qparams = this.getQueryParameters(param);
        if (!param.option?.supportTVP) {
            qparams = qparams.filter(o => !(o instanceof SqlTableValueParameterExpression));
        }
        for (const [k, p] of param.parameters) {
            if (!qparams.includes(k)) {
                continue;
            }
            if (k instanceof SqlTableValueParameterExpression) {
                paramObj.set(`@${p.name}`, JSON.stringify(p.value));
            }
            else {
                paramObj.set(`@${p.name}`, p.value);
            }
        }

        return paramObj;
    }
    protected override toSqlParameterString(expression: SqlParameterExpression, param?: IQueryBuilderContext): string {
        const paramValue = param.parameters.get(expression);
        if (!paramValue) {
            throw new Error(`Sql Parameter ${expression.toString()} no supported`);
        }
        if (param?.option?.supportTVP == true && expression instanceof SqlTableValueParameterExpression) {
            const column = expression.columns.map((col, i) => {
                const itemType = expression.itemSchema?.[col.propertyName];
                let columnType: string;
                let valueType: GenericType;
                if (typeof itemType !== "function") {
                    valueType = itemType.type;
                    columnType = itemType.columnType;
                }
                else {
                    valueType = itemType;
                }
                if (!columnType) {
                    const colTypeFactory = this.valueTypeMap.get(valueType);
                    const colType = colTypeFactory();
                    columnType = this.columnTypeString(colType);
                }
                return `${this.enclose(col.columnName)} ${columnType} '$.${col.propertyName}'`;
            }).join(`,${this.newLine(1, false)}`);
            return `OPENJSON(@${paramValue.name}) WITH(${this.newLine(1)}${column}${this.newLine(-1)}) AS ${this.enclose(expression.alias)}`;
        }

        return "@" + paramValue.name;
    }
    protected override createTempTableQuery<TE extends object>(entityExp: SqlTableValueParameterExpression<TE>, values: TE[], param: IQueryBuilderContext): IQuery[] {
        const result: IQuery[] = [];
        result.push({
            query: `DROP TABLE IF EXISTS ${this.entityName(entityExp)}`,
            type: QueryType.DDL
        });
        const columnDefinition = entityExp.columns.map((c) => {
            const colTypeFactory = this.valueTypeMap.get(c.type);
            const maxValue = Enumerable.from(values).map((o) => (o[c.propertyName] as string)?.length).max();
            const colType = colTypeFactory(maxValue);
            return `${this.enclose(c.columnName)} ${this.columnTypeString(colType)}`;
        }).join("," + this.newLine(1, false));

        const query = `CREATE TABLE ${this.entityName(entityExp)}` +
            `${this.newLine()}(` +
            `${this.newLine(1, false)}${columnDefinition}` +
            `${this.newLine()})`;

        result.push({
            query,
            type: QueryType.DDL
        });

        let i = 0;
        const columns = entityExp.columns;
        const insertQuery = new InsertExpression(entityExp, [], columns);
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

        result.push(...this.getInsertQuery(insertQuery, param.option, param.parameters));

        return result;
    }
    protected override entityName<T extends object>(entityExp: IEntityExpression<T>): string {
        if (entityExp instanceof SqlTableValueParameterExpression) {
            return this.enclose(`#${entityExp.name}`);
        }

        return super.entityName(entityExp);
    }
    public override toOperandString(expression: IExpression, param?: IQueryBuilderContext): string {
        if (expression.type === Boolean && !(expression instanceof ValueExpression) && !isColumnExp(expression)) {
            switch (true) {
                case expression instanceof AndExpression:
                case expression instanceof OrExpression:
                case expression instanceof EqualExpression:
                case expression instanceof StrictEqualExpression:
                case expression instanceof StrictNotEqualExpression:
                case expression instanceof NotEqualExpression:
                case expression instanceof NotExpression:
                case expression instanceof GreaterThanExpression:
                case expression instanceof GreaterEqualExpression:
                case expression instanceof LessThanExpression:
                case expression instanceof LessEqualExpression:
                case expression instanceof InstanceofExpression: {
                    expression = new TernaryExpression(expression as IExpression<boolean>, new ValueExpression(true), new ValueExpression(false));
                    break;
                }
            }
        }

        return this.toString(expression, param);
    }
}
