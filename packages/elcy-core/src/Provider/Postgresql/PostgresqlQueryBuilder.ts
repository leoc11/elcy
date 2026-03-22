import { Enumerable, IEnumerable } from "@elcy/enumerable";
import { IQuery } from "src/Query/IQuery";
import { ICompleteColumnType } from "../../Common/ICompleteColumnType";
import { GenericType, SetterObj } from "../../Common/Type";
import { IQueryLimit } from "../../Data/Interface/IQueryLimit";
import { TimeSpan } from "../../Data/TimeSpan";
import { Uuid } from "../../Data/Uuid";
import { RelationalQueryBuilder } from "../Relational/RelationalQueryBuilder";
import { IQueryBuilderParameter } from "src/Query/IQueryBuilderParameter";
import { SqlParameterExpression } from "src/Queryable/QueryExpression/SqlParameterExpression";
import { QueryType } from "src/Common/Enum";
import { MethodCallExpression } from "src/ExpressionBuilder/Expression/MethodCallExpression";
import { ValueExpression } from "src/ExpressionBuilder/Expression/ValueExpression";
import { DbFunction } from "src/Query/DbFunction";
import { IQueryOption } from "src/Query/IQueryOption";
import { IQueryParameterMap } from "src/Query/IQueryParameter";
import { UpdateExpression } from "src/Queryable/QueryExpression/UpdateExpression";
import { SelectExpression } from "src/Queryable/QueryExpression/SelectExpression";
import { JoinRelation } from "src/Queryable/Interface/JoinRelation";
import { DeleteMode } from "src/Common/StringType";
import { IExpression } from "src/ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "src/ExpressionBuilder/Expression/StrictEqualExpression";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { DeleteExpression } from "src/Queryable/QueryExpression/DeleteExpression";
import { EntityExpression } from "src/Queryable/QueryExpression/EntityExpression";
import { postgresqlQueryTranslator } from "./PostgresqlQueryTranslator";

export class PostgresqlQueryBuilder extends RelationalQueryBuilder {
    public queryLimit: IQueryLimit = {
        maxParameters: 34464
    };
    public override translator = postgresqlQueryTranslator;
    public valueTypeMap = new Map<GenericType, (value: unknown) => ICompleteColumnType>([
        [Uuid, () => ({ columnType: "uuid", group: "Identifier" })],
        [BigInt, () => ({ columnType: "bigint", group: "BigInt" })],
        [TimeSpan, () => ({ columnType: "time", group: "Time" })],
        [Date, () => ({ columnType: "datetime", group: "DateTime" })],
        [String, (val: string) => ({ columnType: "nvarchar", group: "String", option: { length: Math.ceil(val.length / 50) * 50 } })],
        [Number, () => ({ columnType: "decimal", group: "Decimal" })],
        [Boolean, () => ({ columnType: "bit", group: "Boolean" })]
    ]);

    public override enclose(identity: string) {
        let requireEscape = this.namingStrategy.enableEscape;
        if (!requireEscape) {
            requireEscape = identity.search(/[A-Z ]/) !== -1;
        }
        if (requireEscape) {
            return this.encloseIdentifier(identity);
        }
        else {
            return identity;
        }
    }

    public override mergeQueries(queries: IEnumerable<IQuery>): IQuery[] {
        // only able to support merged for query without parameter
        return Enumerable.from(queries).toArray();
    }

    protected override getParameter(param: IQueryBuilderParameter) {
        const paramObj = new Map<string, any>();
        const qparams = param.queryExpression.paramExps
            .filter(o => !o.isSystem);
        for (const [k, p] of param.parameters) {
            if (!qparams.includes(k)) {
                continue;
            }
            paramObj.set(p.name, p.value);
        }

        return paramObj;
    }
    protected override toSqlParameterString(expression: SqlParameterExpression, param: IQueryBuilderParameter): string {
        const paramValue = param.parameters.get(expression);
        if (!paramValue) {
            throw new Error(`Sql Parameter ${expression.toString()} no supported`);
        }

        const indexMap = Enumerable.from(param.parameters).map(o => o[1].name).distinct().toArray();
        const index = indexMap.indexOf(paramValue.name);
        return `$${index + 1}`;
    }

    protected override getUpdateQuery<TE extends object>(updateExp: UpdateExpression<TE>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        const result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: updateExp,
            parameters: parameters,
            option: option
        };

        const setQuery = Object.keys(updateExp.setter).map((o) => {
            const value = updateExp.setter[o as keyof TE];
            const valueStr = this.toOperandString(value, param);
            const column = updateExp.entity.columns.find((c) => c.propertyName === o);
            return `${this.enclose(column.columnName)} = ${valueStr}`;
        });

        if (updateExp.entity.metaData) {
            if (updateExp.entity.metaData.modifiedDateColumn) {
                const colMeta = updateExp.entity.metaData.modifiedDateColumn;
                // only update modifiedDate column if not explicitly specified in update set statement.
                if (!updateExp.setter[colMeta.propertyName]) {
                    const valueExp = new MethodCallExpression(new ValueExpression(DbFunction), colMeta.timeZoneHandling === "utc" ? "utcTimestamp" : "timestamp", []);
                    const valueStr = this.toString(valueExp, param);
                    setQuery.push(`${this.enclose(colMeta.columnName)} = ${valueStr}`);
                }
            }

            if (updateExp.entity.metaData.versionColumn) {
                const colMeta = updateExp.entity.metaData.versionColumn;
                if (updateExp.setter[colMeta.propertyName]) {
                    throw new Error(`${colMeta.propertyName} is a version column and should not be update explicitly`);
                }
            }
        }

        let firstJoin: JoinRelation<TE> = null;
        const whereQueries: string[] = [];
        let joins = updateExp.joins.slice();
        if (joins.length) {
            firstJoin = joins.shift();
            whereQueries.push(this.toLogicalString(firstJoin.relation, param));
        }
        if (updateExp.where) {
            whereQueries.push(this.toLogicalString(updateExp.where, param));
        }
        let updateQuery = `UPDATE ${this.entityName(updateExp.entity)} AS ${this.enclose(updateExp.entity.alias)}` +
            this.newLine() + `SET ${setQuery.join(", ")}`;

        if (firstJoin) {
            updateQuery += this.newLine() + `FROM ${this.entityName(firstJoin.child.entity)} AS ${this.enclose(firstJoin.child.entity.alias)}` +
                this.getJoinQueryString(joins, param);
        }
        if (whereQueries.length) {
            updateQuery += this.newLine() + "WHERE " + whereQueries.join(" AND ");
        }

        if (updateExp.returnings.length) {
            updateQuery += `${this.newLine()}RETURNING ${updateExp.returnings.map(o => this.enclose(o.columnName)).join(",")}`
        }

        result.push({
            query: updateQuery,
            type: QueryType.DML,
            parameters: this.getParameter(param)
        });

        return result;
    }

    protected override getDeleteQuery<TE extends object>(deleteExp: DeleteExpression<TE>, option: IQueryOption, parameters: IQueryParameterMap): IQuery[] {
        let result: IQuery[] = [];
        const param: IQueryBuilderParameter = {
            queryExpression: deleteExp,
            parameters: parameters,
            option: option
        };

        let deleteStrategy: DeleteMode;
        if (deleteExp.deleteMode) {
            deleteStrategy = this.extractValue(deleteExp.deleteMode, param);
        }

        if (!deleteStrategy) {
            deleteStrategy = deleteExp.entity.deleteColumn ? "soft" : "hard";
        }
        else if (deleteStrategy === "soft" && !deleteExp.entity.deleteColumn) {
            // if entity did not support soft delete, then abort.
            throw new Error(`'${deleteExp.entity.name}' did not support 'Soft' delete`);
        }

        if (deleteStrategy === "soft") {
            // if soft delete, set delete column to true
            const set: SetterObj<TE> = {};
            set[deleteExp.entity.deleteColumn.propertyName] = new ValueExpression(true) as any;
            const updateQuery = new UpdateExpression(deleteExp.select, set);
            result = this.getUpdateQuery(updateQuery, param.option, param.parameters);

            // apply delete option rule. coz soft delete delete option will not handled by db.
            const entityMeta: IEntityMetaData<TE> = deleteExp.entity.metaData;
            const relations = entityMeta.relations.filter((o) => o.isMaster);
            result = result.concat(relations.flatMap((o) => {
                if (o.completeRelationType === "many-many") {
                    throw new Error("many-many relation not supported");
                }

                const target = o.target;
                const deleteOption = o.reverseRelation.deleteOption;
                const relationColumns = o.reverseRelation.relationColumns;
                const child = new SelectExpression(new EntityExpression(target.type, target.type.name));
                child.addJoin(deleteExp.select, o.reverseRelation, "INNER");
                switch (deleteOption) {
                    case "CASCADE": {
                        const childDelete = new DeleteExpression(child, deleteExp.deleteMode);
                        if (childDelete.entity.deleteColumn && !param.option.includeSoftDeleted) {
                            childDelete.addWhere(new StrictEqualExpression(childDelete.entity.deleteColumn, new ValueExpression(false)));
                        }
                        return this.getDeleteQuery(childDelete, param.option, param.parameters);
                    }
                    case "SET NULL": {
                        const setOption: { [key: string]: IExpression<any> } = {};
                        for (const col of relationColumns) {
                            setOption[col.propertyName] = new ValueExpression(null);
                        }
                        const childUpdate = new UpdateExpression(child, setOption);
                        return this.getUpdateQuery(childUpdate, param.option, param.parameters);
                    }
                    case "SET DEFAULT": {
                        const setOption: { [key: string]: IExpression<any> } = {};
                        for (const col of o.reverseRelation.relationColumns) {
                            if (col.defaultExp) {
                                setOption[col.columnName] = col.defaultExp.body;
                            }
                            else {
                                setOption[col.columnName] = new ValueExpression(null);
                            }
                        }
                        const childUpdate = new UpdateExpression(child, setOption);
                        return this.getUpdateQuery(childUpdate, param.option, param.parameters);
                    }
                    case "NO ACTION":
                    case "RESTRICT":
                    default:
                        return [];
                }
            }));
        }
        else {

            let firstJoin: JoinRelation<TE> = null;
            const whereQueries: string[] = [];
            let joins = deleteExp.joins.slice();
            if (joins.length) {
                firstJoin = joins.shift();
                whereQueries.push(this.toLogicalString(firstJoin.relation, param));
            }
            if (deleteExp.where) {
                whereQueries.push(this.toLogicalString(deleteExp.where, param));
            }
            let deleteQuery = `DELETE FROM ${this.entityName(deleteExp.entity)} AS ${this.enclose(deleteExp.entity.alias)}`;
            if (firstJoin) {
                deleteQuery += this.newLine() + `USING ${this.entityName(firstJoin.child.entity)} AS ${this.enclose(firstJoin.child.entity.alias)}` +
                    this.getJoinQueryString(joins, param);
            }
            if (whereQueries.length) {
                deleteQuery += this.newLine() + "WHERE " + whereQueries.join(" AND ");
            }

            result.push({
                query: deleteQuery,
                type: QueryType.DML,
                parameters: this.getParameter(param)
            });
        }

        const clone = deleteExp.clone();

        const replaceMap = new Map();
        for (const col of deleteExp.entity.columns) {
            const cloneCol = clone.entity.columns.find((c) => c.columnName === col.columnName);
            replaceMap.set(col, cloneCol);
        }
        const includedDeletes = deleteExp.includes.flatMap((o) => {
            const child = o.child.clone();
            for (const col of o.child.entity.columns) {
                const cloneChildCol = child.entity.columns.find((c) => c.columnName === col.columnName);
                replaceMap.set(col, cloneChildCol);
            }
            const relations = o.relation.clone(replaceMap);
            child.addJoin(clone.select, relations, "INNER");
            if (clone.select.where) {
                child.addWhere(clone.select.where);
                clone.select.where = null;
            }
            return this.getDeleteQuery(child, param.option, param.parameters);
        });
        result = result.concat(includedDeletes);
        return result;
    }
}
