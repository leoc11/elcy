import { Enumerable } from "@elcy/enumerable";
import { QueryType } from "src/Common/Enum";
import { IQuery } from "src/Query/IQuery";
import { IQueryBuilderParameter } from "src/Query/IQueryBuilderParameter";
import { IQueryOption } from "src/Query/IQueryOption";
import { IQueryParameterMap } from "src/Query/IQueryParameter";
import { InsertExpression } from "src/Queryable/QueryExpression/InsertExpression";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { MysqlColumnType } from "./IndexedDbColumnType";
import { EntityExpression } from "src/Queryable/QueryExpression/EntityExpression";
import { IntegerColumnMetaData } from "src/MetaData/IntegerColumnMetaData";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { RawSqlExpression } from "src/Queryable/QueryExpression/RawSqlExpression";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { TemporaryEntityExpression } from "src/Queryable/QueryExpression/TemporaryEntityExpression";
import { ValueExpression } from "src/ExpressionBuilder/Expression/ValueExpression";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { AndExpression } from "src/ExpressionBuilder/Expression/AndExpression";
import { ColumnExpression } from "src/Queryable/QueryExpression/ColumnExpression";
import { ParameterExpression } from "src/ExpressionBuilder/Expression/ParameterExpression";

export class IndexedDbQueryBuilder extends RelationalQueryBuilder {
    //#region column type map
    public queryLimit: IQueryLimit = {
        maxParameters: 65530,
        maxQueryLength: 8388608
    };
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType<MysqlColumnType>>([
        [Uuid, () => ({ columnType: "binary", option: { size: 16 } })],
        [TimeSpan, () => ({ columnType: "time" })],
        [Date, () => ({ columnType: "datetime" })],
        [String, (val: string) => ({ columnType: "varchar", option: { length: 255 + (Math.ceil(Math.max(val.length - 255, 0) / 50) * 50) } })],
        [Number, () => ({ columnType: "decimal", option: { precision: 18, scale: 0 } })],
        [Boolean, () => ({ columnType: "bit" })]
    ]);

    //#endregion
    protected override getInsertQuery<TE extends object>(insertExp: InsertExpression<TE>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        if (insertExp.values.length <= 0) {
            return [];
        }

        const param: IQueryBuilderParameter = {
            queryExpression: insertExp,
            parameters: parameters,
            option: option
        };

        const colString = Enumerable.from(insertExp.columns).map((o) => this.enclose(o.columnName)).reduce((acc, item) => acc ? acc + "," + item : item, "");
        const insertQuery = `INSERT INTO ${this.entityName(insertExp.entity)}(${colString}) VALUES`;

        const result: IQuery[] = [];
        const entityMeta = (insertExp.entity as EntityExpression<TE>).metaData;
        // for self reference auto increment pk, need to split those.
        // TODO: maybe should check for insert generated pk too?
        if (entityMeta.hasIncrementPrimary) {
            // if primary key is auto increment, then need to split all query per entry.
            // and there should only 1 incremental column in a table.
            const selects = Enumerable.from(insertExp.returnings)
                .map((o) => {
                    let colStr = this.getColumnQueryString(o, param);
                    // NOTE: computed column should always has alias
                    if (o.alias) {
                        colStr += " AS " + this.enclose(o.alias);
                    }

                    return colStr;
                })
                .toArray()
                .join("," + this.newLine(1, false));
            const incrementColumn = insertExp.returnings
                .find(o => (o.columnMeta as IntegerColumnMetaData<TE>)?.autoIncrement);
            const where = `${this.newLine()}WHERE ${this.toString(new StrictEqualExpression(incrementColumn, new RawSqlExpression(incrementColumn.type, "LAST_INSERT_ID()")))}`;
            for (const itemExp of insertExp.values) {
                let queryCommand: IQuery = {
                    query: insertQuery,
                    type: QueryType.DML,
                    parameters: new Map()
                };
                const values: string[] = [];
                this.indent++;
                for (const col of insertExp.columns) {
                    const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                    if (valueExp) {
                        values.push(this.toString(valueExp, param));
                        const paramExp = param.parameters.get(valueExp);
                        if (paramExp) {
                            queryCommand.parameters.set(paramExp.name, paramExp.value);
                        }
                    }
                    else {
                        values.push("DEFAULT");
                    }
                }
                this.indent--;

                queryCommand.query += `${this.newLine()}(${values.join(",")}),`;
                result.push(queryCommand);

                result.push({
                    query: `SELECT ${selects} FROM ${this.entityName(insertExp.entity)}${where}`,
                    type: QueryType.DQL,
                    parameters: new Map()
                });
            }
        }
        else {
            let queryCommand: IQuery = {
                query: insertQuery,
                type: QueryType.DML,
                parameters: new Map()
            };
            result.push(queryCommand);
            let count = 0;
            this.indent++;

            let tempTable: TemporaryEntityExpression;
            let tempValues: Record<string, unknown>[];
            if (insertExp.returnings.length) {
                tempTable = new TemporaryEntityExpression("temp_insert", insertExp.entity.primaryColumns, Object, this.newAlias());
                tempTable.columns.push(new ColumnExpression(tempTable, Number, "__index", "__index", true));
                tempValues = [];
            }
            for (const itemExp of insertExp.values) {
                const isLimitExceed = this.queryLimit.maxParameters && (count + insertExp.columns.length) > this.queryLimit.maxParameters;
                if (isLimitExceed) {
                    queryCommand.query = queryCommand.query.slice(0, -1);
                    queryCommand = {
                        query: insertQuery,
                        type: QueryType.DML,
                        parameters: new Map()
                    };
                    count = 0;
                    result.push(queryCommand);
                }

                const values: string[] = [];
                let pkObj: Record<string, unknown>;
                if (tempValues) {
                    pkObj = {};
                    tempValues.push(pkObj);
                }
                for (const col of insertExp.columns) {
                    const valueExp = itemExp[col.propertyName] as SqlParameterExpression | ValueExpression;
                    if (valueExp) {
                        values.push(this.toString(valueExp, param));
                        const paramExp = param.parameters.get(valueExp as SqlParameterExpression);
                        if (paramExp) {
                            queryCommand.parameters.set(paramExp.name, paramExp.value);
                            count++;
                        }
                        if (pkObj) {
                            pkObj[col.columnName] = paramExp ? paramExp.value : (valueExp as ValueExpression).value;
                        }
                    }
                    else {
                        values.push("DEFAULT");
                    }
                }

                queryCommand.query += `${this.newLine()}(${values.join(",")}),`;
            }
            this.indent--;
            queryCommand.query = queryCommand.query.slice(0, -1);

            if (tempTable) {
                result.push(...this.createTempTableQuery(tempTable, tempValues, option));

                const select = new SelectExpression(insertExp.entity);
                select.selects = insertExp.returnings.slice(0);

                const tempSelectExp = new SelectExpression(tempTable);
                tempSelectExp.selects = tempTable.columns.filter((o) => !o.isPrimary);
                tempSelectExp.isSubSelect = true;
                const relation = insertExp.entity.primaryColumns.reduce((r, o) => {
                    const rel = new StrictEqualExpression(o, tempTable.columns.find(t => t.columnName == o.columnName));
                    return r ? new AndExpression(r, rel) : rel;
                }, null as IExpression<boolean>);
                select.addJoin(tempSelectExp, relation, "INNER");

                const arrayParamExp = new ParameterExpression(`0:temp_inserts`, Array);
                const sqlParamExp = select.addSqlParameter(arrayParamExp, tempTable);

                const selectParamMap: IQueryParameterMap = new Map([[sqlParamExp, { value: tempValues }]]);
                result.push(...this.getSelectQuery(select, option, selectParamMap));
            }
        }

        return result;
    }
}
