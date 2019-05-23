import { ColumnGeneration, IsolationLevel, QueryType } from "../Common/Type";
import { IConnection } from "../Connection/IConnection";
import { TimeSpan } from "../Data/TimeSpan";
import { Uuid } from "../Data/Uuid";
import { IEnumerable } from "../Enumerable/IEnumerable";
import { EventHandlerFactory } from "../Event/EventHandlerFactory";
import { IEventDispacher, IEventHandler } from "../Event/IEventHandler";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionExecutor } from "../ExpressionBuilder/ExpressionExecutor";
import { isNotNull } from "../Helper/Util";
import { IntegerColumnMetaData } from "../MetaData/IntegerColumnMetaData";
import { StringColumnMetaData } from "../MetaData/StringColumnMetaData";
import { BatchedQuery } from "../Query/BatchedQuery";
import { DeferredQuery } from "../Query/DeferredQuery";
import { IQuery } from "../Query/IQuery";
import { IQueryResult } from "../Query/IQueryResult";
import { IncludeRelation } from "../Queryable/Interface/IncludeRelation";
import { PagingJoinRelation } from "../Queryable/Interface/PagingJoinRelation";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import { InsertIntoExpression } from "../Queryable/QueryExpression/InsertIntoExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";
import { SqlTableValueParameterExpression } from "../Queryable/QueryExpression/SqlTableValueParameterExpression";
import { UpdateExpression } from "../Queryable/QueryExpression/UpdateExpression";
import { UpsertExpression } from "../Queryable/QueryExpression/UpsertExpression";

const charList = ["a", "a", "i", "i", "u", "u", "e", "e", "o", "o", " ", " ", " ", "h", "w", "l", "r", "y"];
export class MockConnection implements IConnection {
    public get results() {
        if (!this._results) {
            if (!this._generatedResults) {
                this._generatedResults = this.generateQueryResult();
            }
            return this._generatedResults;
        }

        return this._results;
    }
    public set results(value) {
        this._results = value;
    }
    public get inTransaction(): boolean {
        return this._transactionCount > 0;
    }
    public deferredQueries: IEnumerable<DeferredQuery>;

    //#region Abstract Member
    public isolationLevel: IsolationLevel;
    public database: string;
    public isOpen: boolean;
    public errorEvent: IEventHandler<MockConnection, Error>;
    protected onError: IEventDispacher<Error>;
    private _results: IQueryResult[];
    private _generatedResults: IQueryResult[];
    private _transactionCount: number = 0;
    constructor(database?: string) {
        this.database = database || "database";
        [this.errorEvent, this.onError] = EventHandlerFactory(this);
    }
    public setQueries(deferredQueries: IEnumerable<DeferredQuery>) {
        this.deferredQueries = deferredQueries;
        this._generatedResults = null;
    }
    public generateQueryResult() {
        return this.deferredQueries
            .selectMany((deferred) => {
                const command = deferred.command;
                const tvps = command.paramExps.where((o) => o instanceof SqlTableValueParameterExpression).toArray();
                const skipCount = tvps.length;
                if (command instanceof InsertIntoExpression) {
                    let i = 0;
                    return deferred.queries.select((query) => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        i++;
                        if (query.type & QueryType.DML) {
                            if (i >= skipCount) {
                                result.effectedRows = Math.floor(Math.random() * 100 + 1);
                            }
                            else {
                                const arrayParameter = tvps[i];
                                const queryValue = deferred.parameters.get(arrayParameter);
                                if (Array.isArray(queryValue.value)) {
                                    result.effectedRows = queryValue.value.length;
                                }
                            }
                        }
                        return result;
                    });
                }
                else if (command instanceof SelectExpression) {
                    const selects = this.flattenSelectExpression(command as any);
                    const map: Map<SelectExpression, any[]> = new Map();
                    for (const select of selects) {
                        const rows: any[] = [];
                        map.set(select, rows);
                        if (select.parentRelation) {
                            const parentInclude = select.parentRelation as IncludeRelation;
                            const relMap = Array.from(parentInclude.relationMap());

                            let parentExp = parentInclude.parent;
                            while (parentExp.parentRelation && parentExp.parentRelation.isEmbedded) {
                                parentExp = parentExp.parentRelation.parent;
                            }
                            const parentRows = map.get(parentExp);

                            const maxRowCount = this.getMaxCount(select, deferred, 3);

                            for (const parent of parentRows) {
                                const numberOfRecord = parentInclude.type === "one" ? 1 : Math.floor(Math.random() * maxRowCount) + 1;
                                for (let i = 0; i < numberOfRecord; i++) {
                                    const item = {} as any;
                                    for (const o of select.projectedColumns) {
                                        item[o.dataPropertyName] = this.generateValue(o);
                                    }
                                    rows.push(item);

                                    for (const [parentCol, entityCol] of relMap) {
                                        item[entityCol.alias || entityCol.columnName] = parent[parentCol.alias || parentCol.columnName];
                                    }
                                }
                            }
                        }
                        else {
                            const maxRowCount = this.getMaxCount(select, deferred, 10);
                            const numberOfRecord = Math.floor(Math.random() * maxRowCount) + 1;
                            for (let i = 0; i < numberOfRecord; i++) {
                                const item = {} as any;
                                for (const o of select.projectedColumns) {
                                    item[o.dataPropertyName] = this.generateValue(o);
                                }
                                rows.push(item);
                            }
                        }
                    }

                    const generatedResults = Array.from(map.values());
                    let index = 0;
                    return deferred.queries.select((query) => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type & QueryType.DML) {
                            const arrayParameter = tvps[index];
                            const paramValue = deferred.parameters.get(arrayParameter);
                            if (Array.isArray(paramValue.value)) {
                                result.effectedRows = paramValue.value.length;
                            }
                        }
                        else if (query.type & QueryType.DQL) {
                            const rows = generatedResults[generatedResults.length - (++index)];
                            result.rows = rows;
                        }
                        return result;
                    });
                }
                else if (command instanceof InsertExpression) {
                    let i = 0;
                    const generatedColumns = command.entity.columns.where((o) => isNotNull(o.columnMeta))
                        .where((o) => (o.columnMeta!.generation & ColumnGeneration.Insert) !== 0 || !!o.columnMeta!.defaultExp).toArray();

                    return deferred.queries.select((query) => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        i++;
                        if (query.type & QueryType.DQL) {
                            const rows = command.values.select((o) => {
                                const val: { [key in any]: any } = {};
                                for (const col of generatedColumns) {
                                    val[col.dataPropertyName] = this.generateValue(col);
                                }
                                return val;
                            }).toArray();
                            result.rows = rows;
                        }
                        if (query.type & QueryType.DML) {
                            if (i >= skipCount) {
                                result.effectedRows = command.values.length;
                            }
                            else {
                                const arrayParameter = tvps[i];
                                const paramValue = deferred.parameters.get(arrayParameter);
                                if (Array.isArray(paramValue.value)) {
                                    result.effectedRows = paramValue.value.length;
                                }
                            }
                        }
                        return result;
                    });
                }
                else if (command instanceof UpdateExpression) {
                    let i = 0;
                    return deferred.queries.select((query) => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type & QueryType.DML) {
                            i++;
                            if (i < skipCount) {
                                const arrayParameter = tvps[i];
                                const paramValue = deferred.parameters.get(arrayParameter);
                                if (Array.isArray(paramValue.value)) {
                                    result.effectedRows = paramValue.value.length;
                                }
                            }
                        }
                        return result;
                    });
                }
                else if (command instanceof DeleteExpression) {
                    let i = 0;
                    return deferred.queries.select((query) => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type & QueryType.DML) {
                            i++;
                            if (i < skipCount) {
                                const arrayParameter = tvps[i];
                                const paramValue = deferred.parameters.get(arrayParameter);
                                if (Array.isArray(paramValue.value)) {
                                    result.effectedRows = paramValue.value.length;
                                }
                            }
                        }
                        return result;
                    });
                }
                else if (command instanceof UpsertExpression) {
                    const dmlCount = deferred.queries.where((o) => (o.type & QueryType.DML) !== 0).count();
                    let i = 0;
                    return deferred.queries.select((query) => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type & QueryType.DML) {
                            i++;
                            if (i !== dmlCount) {
                                const arrayParameter = tvps[i];
                                const paramValue = deferred.parameters.get(arrayParameter);
                                if (Array.isArray(paramValue.value)) {
                                    result.effectedRows = paramValue.value.length;
                                }
                            }
                        }
                        return result;
                    });
                }

                return [];
            }).toArray();
    }
    public generateValue(column: IColumnExpression) {
        if (column.columnMeta) {
            const columnMeta = column.columnMeta;
            if (columnMeta.defaultExp) {
                return ExpressionExecutor.execute(columnMeta.defaultExp.body);
            }
        }

        switch (column.type) {
            case Uuid:
                return Uuid.new().toString();
            case Number:
                let fix = 2;
                if (column.columnMeta && column.columnMeta instanceof IntegerColumnMetaData) {
                    fix = 0;
                }

                return Number((Math.random() * 10000 + 1).toFixed(fix));
            case String: {
                let result = "";
                let number = Math.random() * 100 + 1;
                if (column.columnMeta && column.columnMeta instanceof StringColumnMetaData && column.columnMeta.length > 0) {
                    number = column.columnMeta.length;
                }
                for (let i = 0; i < number; i++) {
                    let char = String.fromCharCode(Math.round(Math.random() * 90) + 32);
                    if (/[^a-z ]/i.test(char)) {
                        char = charList[Math.floor(Math.random() * charList.length)];
                    }
                    result += char;
                }
                return result;
            }
            case Date: {
                const number = Math.round(Math.random() * 31536000000) + 1514653200000;
                return new Date(number);
            }
            case TimeSpan: {
                const number = Math.round(Math.random() * 86400000);
                return new TimeSpan(number);
            }
            case Boolean: {
                return Boolean(Math.round(Math.random()));
            }
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
            case DataView: {
                const size = Math.floor((Math.random() * 16) + 1);
                const values = Array(size);
                for (let i = 0; i < size; i++) {
                    values[0] = Math.floor(Math.random() * 256);
                }
                const result = new Uint8Array(values);
                return result;
            }
        }
        return null;
    }
    public async query(command: IQuery): Promise<IQueryResult[]>;
    public async query(query: string, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    public async query(query: string, type?: QueryType, parameters?: Map<string, any>): Promise<IQueryResult[]>;
    public async query(commandOrQuery: IQuery | string, parametersOrType?: Map<string, any> | QueryType, parameters?: Map<string, any>): Promise<IQueryResult[]> {
        let command: IQuery;
        if (typeof commandOrQuery === "string") {
            let type: QueryType;
            if (parametersOrType instanceof Map) {
                parameters = parametersOrType;
                type = QueryType.DQL;
            }
            else {
                type = parametersOrType;
            }
            command = {
                query: commandOrQuery,
                type: type,
                parameters: parameters
            };
        }
        else {
            command = commandOrQuery;
        }
        const count = (command as BatchedQuery).queryCount || 1;
        return this.results.splice(0, count);
    }
    public close(): Promise<void> {
        return Promise.resolve();
    }
    public open(): Promise<void> {
        return Promise.resolve();
    }
    public reset(): Promise<void> {
        return Promise.resolve();
    }
    public startTransaction(): Promise<void> {
        this._transactionCount++;
        return Promise.resolve();
    }
    public commitTransaction(): Promise<void> {
        this._transactionCount--;
        return Promise.resolve();
    }
    public rollbackTransaction(): Promise<void> {
        this._transactionCount--;
        return Promise.resolve();
    }
    public setIsolationLevel(isolationLevel: IsolationLevel): Promise<void> {
        return Promise.resolve();
    }

    protected getMaxCount(select: SelectExpression, deferred: DeferredQuery, defaultValue = 10) {
        if (select.paging && select.paging.take) {
            defaultValue = this.extractValue(deferred, select.paging.take);
        }
        else {
            const takeJoin = select.joins.first((o) => o instanceof PagingJoinRelation) as PagingJoinRelation;
            if (takeJoin) {
                if (takeJoin.end) {
                    defaultValue = this.extractValue(deferred, takeJoin.end);
                    if (takeJoin.start) {
                        defaultValue -= this.extractValue(deferred, takeJoin.start);
                    }
                }
            }
        }

        return defaultValue;
    }
    protected extractValue(o: DeferredQuery, exp: IExpression) {
        if (exp instanceof ValueExpression) {
            return ExpressionExecutor.execute(exp);
        }
        else if (exp instanceof SqlParameterExpression) {
            const sqlParam = o.parameters.get(exp);
            if (sqlParam) {
                return sqlParam.value;
            }
        }
        return null;
    }
    protected flattenSelectExpression(selectExp: SelectExpression): SelectExpression[] {
        const results = [selectExp];
        for (let i = 0; i < results.length; i++) {
            const select = results[i];
            const addition = select.resolvedIncludes.select((o) => o.child).toArray().reverse();
            results.splice(i + 1, 0, ...addition);
        }
        return results;
    }

    //#endregion
}
