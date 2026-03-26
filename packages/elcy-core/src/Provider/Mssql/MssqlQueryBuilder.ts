import { TemporaryEntityExpression } from "src/Queryable/QueryExpression/TemporaryEntityExpression";
import { ColumnGeneration, QueryType } from "../../Common/Enum";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType, IObjectType, SetterObj } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { MethodCallExpression } from "../../ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { isColumnExp, isNotNull, isNull } from "../../Helper/Util";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { DbFunction } from "../../Query/DbFunction";
import { IQuery } from "../../Query/IQuery";
import { IQueryBuilderParameter } from "../../Query/IQueryBuilderParameter";
import { IQueryOption } from "../../Query/IQueryOption";
import { IQueryParameterMap } from "../../Query/IQueryParameter";
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

export class MssqlQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 2100,
        maxQueryLength: 67108864
    };
    public override translator = mssqlQueryTranslator;
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType<MssqlColumnType>>([
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
    public override getInsertQuery<TE extends object>(insertExp: InsertExpression<TE>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        if (insertExp.values.length <= 0) {
            return [];
        }

        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: insertExp
        };
        const colString = insertExp.columns.map((o) => this.enclose(o.columnName)).join(", ");
        let output = Enumerable.from(insertExp.entity.columns).filter((o) => isNotNull(o.columnMeta))
            .filter((o) => (o.columnMeta.generation & ColumnGeneration.Insert) !== 0 || !!o.columnMeta.defaultExp)
            .map((o) => `INSERTED.${this.enclose(o.columnName)} AS ${o.propertyName}`)
            .toArray()
            .join(", ");
        if (output) {
            output = " OUTPUT " + output;
        }

        const insertQuery = `INSERT INTO ${this.entityName(insertExp.entity)}(${colString})${output} VALUES`;
        let queryCommand: IQuery = {
            query: insertQuery,
            parameters: new Map(),
            type: QueryType.DML
        };
        if (output) {
            queryCommand.type |= QueryType.DQL;
        }

        const result: IQuery[] = [queryCommand];
        let count = 0;
        this.indent++;
        for (const itemExp of insertExp.values) {
            const isLimitExceed = this.queryLimit.maxParameters && (count + insertExp.columns.length) > this.queryLimit.maxParameters;
            if (isLimitExceed) {
                queryCommand.query = queryCommand.query.slice(0, -1);
                queryCommand = {
                    query: insertQuery,
                    parameters: new Map(),
                    type: QueryType.DML
                };
                count = 0;
                result.push(queryCommand);
            }

            const values: string[] = [];
            for (const col of insertExp.columns) {
                const valueExp = itemExp[col.propertyName] as SqlParameterExpression;
                if (valueExp) {
                    values.push(this.toString(valueExp, param));
                    const paramExp = param.parameters.get(valueExp);
                    if (paramExp) {
                        queryCommand.parameters.set(paramExp.name, paramExp.value);
                        count++;
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

        return result;
    }

    //#region Update
    public override getUpdateQuery<TE extends object>(updateExp: UpdateExpression<TE>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        const result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            option: option,
            parameters: parameters,
            queryExpression: updateExp
        };

        const setQuery = Object.keys(updateExp.setter).map((o) => {
            const value = updateExp.setter[o as keyof TE];
            const valueStr = this.toOperandString(value, param);
            const column = updateExp.entity.columns.find((c) => c.propertyName === o);
            return `${this.enclose(updateExp.entity.alias)}.${this.enclose(column.columnName)} = ${valueStr}`;
        });

        if (updateExp.entity.metaData) {
            if (updateExp.entity.metaData.modifiedDateColumn) {
                const colMeta = updateExp.entity.metaData.modifiedDateColumn;
                // only update modifiedDate column if not explicitly specified in update set statement.
                if (!updateExp.setter[colMeta.propertyName]) {
                    const valueExp = new MethodCallExpression(new ValueExpression(DbFunction), colMeta.timeZoneHandling === "utc" ? "utcTimestamp" : "timestamp", []);
                    const valueStr = this.toString(valueExp, param);
                    setQuery.push(`${this.enclose(updateExp.entity.alias)}.${this.enclose(colMeta.columnName)} = ${valueStr}`);
                }
            }

            if (updateExp.entity.metaData.versionColumn) {
                const colMeta = updateExp.entity.metaData.versionColumn;
                if (updateExp.setter[colMeta.propertyName]) {
                    throw new Error(`${colMeta.propertyName} is a version column and should not be update explicitly`);
                }
            }
        }

        let updateQuery = `UPDATE ${this.enclose(updateExp.entity.alias)}` +
            this.newLine() + `SET ${setQuery.join(", ")}` +
            this.newLine() + `FROM ${this.enclose(updateExp.entity.name)} AS ${this.enclose(updateExp.entity.alias)}` +
            this.getJoinQueryString(updateExp.joins, param);
        if (updateExp.where) {
            updateQuery += this.newLine() + "WHERE " + this.toLogicalString(updateExp.where, param);
        }

        result.push({
            query: updateQuery,
            parameters: this.getParameter(param),
            type: QueryType.DML
        });

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
    //#endregion
    public override toPropertyValue<T>(input: any, column: IColumnMetaData<any, T>): T {
        if (column instanceof RowVersionColumnMetaData) {
            return new (column.type as IObjectType<T>)(input.buffer ? input.buffer : input);
        }
        return super.toPropertyValue(input, column);
    }
    protected override booleanString(value: boolean) {
        return value ? "1" : "0";
    }
    protected override createTempTableQuery<T extends object>(entityExp: TemporaryEntityExpression<T>, values: T[], option: IQueryOption): IQuery[] {
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
            insertQuery.values.push(itemExp as SetterObj<T>);
        }

        result.push(...this.getInsertQuery(insertQuery, option, new Map()));

        return result;
    }
    protected override entityName<T extends object>(entityExp: IEntityExpression<T>): string {
        if (entityExp instanceof TemporaryEntityExpression) {
            return this.enclose(`#${entityExp.name}`);
        }

        return super.entityName(entityExp);
    }
    public override toOperandString(expression: IExpression, param?: IQueryBuilderParameter): string {
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
