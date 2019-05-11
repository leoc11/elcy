import { IConnection } from "../Connection/IConnection";
import { DeferredQuery } from "../Query/DeferredQuery";
import { IQueryResult } from "../Query/IQueryResult";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { QueryType, IsolationLevel, ColumnGeneration } from "../Common/Type";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import { UpdateExpression } from "../Queryable/QueryExpression/UpdateExpression";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
import { UpsertExpression } from "../Queryable/QueryExpression/UpsertExpression";
import { Uuid } from "../Data/Uuid";
import { TimeSpan } from "../Data/TimeSpan";
import { IQuery } from "../Query/IQuery";
import { BatchedQuery } from "../Query/BatchedQuery";
import { EventHandlerFactory } from "../Event/EventHandlerFactory";
import { IEventHandler, IEventDispacher } from "../Event/IEventHandler";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { PagingJoinRelation } from "../Queryable/Interface/PagingJoinRelation";
import { IncludeRelation } from "../Queryable/Interface/IncludeRelation";
import { StringColumnMetaData } from "../MetaData/StringColumnMetaData";
import { isNotNull } from "../Helper/Util";
import { IntegerColumnMetaData } from "../MetaData/IntegerColumnMetaData";
import { InsertIntoExpression } from "../Queryable/QueryExpression/InsertIntoExpression";
import { ExpressionExecutor } from "../ExpressionBuilder/ExpressionExecutor";
import { SqlTableValueParameterExpression } from "../Queryable/QueryExpression/SqlTableValueParameterExpression";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";
import { IEnumerable } from "../Enumerable/IEnumerable";

const charList = ["a", "a", "i", "i", "u", "u", "e", "e", "o", "o", " ", " ", " ", "h", "w", "l", "r", "y"];
export class MockConnection implements IConnection {
    public deferredQueries: IEnumerable<DeferredQuery>;
    private _results: IQueryResult[];
    private _generatedResults: IQueryResult[];
    public setQueries(deferredQueries: IEnumerable<DeferredQuery>) {
        this.deferredQueries = deferredQueries;
        this._generatedResults = null;
    }
    public get results() {
        if (!this._results) {
            if (!this._generatedResults)
                this._generatedResults = this.generateQueryResult();
            return this._generatedResults;
        }

        return this._results;
    }
    public set results(value) {
        this._results = value;
    }
    public generateQueryResult() {
        return this.deferredQueries
            .selectMany(o => {
                const command = o.command;
                const tvps = command.paramExps.where(o => o instanceof SqlTableValueParameterExpression).toArray();
                const skipCount = tvps.length;
                if (command instanceof InsertIntoExpression) {
                    let i = 0;
                    return o.queries.select(query => {
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
                                const queryValue = o.parameters.get(arrayParameter);
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

                            let parent = parentInclude.parent;
                            while (parent.parentRelation && parent.parentRelation.isEmbedded) {
                                parent = parent.parentRelation.parent;
                            }
                            const parentRows = map.get(parent);

                            const maxRowCount = this.getMaxCount(select, o, 3);

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
                            const maxRowCount = this.getMaxCount(select, o, 10);
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
                    let i = 0;
                    return o.queries.select(query => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type & QueryType.DML) {
                            const arrayParameter = tvps[i];
                            const paramValue = o.parameters.get(arrayParameter);
                            if (Array.isArray(paramValue.value)) {
                                result.effectedRows = paramValue.value.length;
                            }
                        }
                        else if (query.type & QueryType.DQL) {
                            const rows = generatedResults[generatedResults.length - (++i)];
                            result.rows = rows;
                        }
                        return result;
                    });
                }
                else if (command instanceof InsertExpression) {
                    let i = 0;
                    const generatedColumns = command.entity.columns.where(o => isNotNull(o.columnMeta))
                        .where(o => (o.columnMeta!.generation & ColumnGeneration.Insert) !== 0 || !!o.columnMeta!.defaultExp).toArray();

                    return o.queries.select(query => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        i++;
                        if (query.type & QueryType.DQL) {
                            const rows = command.values.select(o => {
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
                                const paramValue = o.parameters.get(arrayParameter);
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
                    return o.queries.select(query => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type & QueryType.DML) {
                            i++;
                            if (i < skipCount) {
                                const arrayParameter = tvps[i];
                                const paramValue = o.parameters.get(arrayParameter);
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
                    return o.queries.select(query => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type & QueryType.DML) {
                            i++;
                            if (i < skipCount) {
                                const arrayParameter = tvps[i];
                                const paramValue = o.parameters.get(arrayParameter);
                                if (Array.isArray(paramValue.value)) {
                                    result.effectedRows = paramValue.value.length;
                                }
                            }
                        }
                        return result;
                    });
                }
                else if (command instanceof UpsertExpression) {
                    const dmlCount = o.queries.where(o => (o.type & QueryType.DML) !== 0).count();
                    let i = 0;
                    return o.queries.select(query => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type & QueryType.DML) {
                            i++;
                            if (i !== dmlCount) {
                                const arrayParameter = tvps[i];
                                const paramValue = o.parameters.get(arrayParameter);
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

    protected getMaxCount(select: SelectExpression, o: DeferredQuery, defaultValue = 10) {
        if (select.paging && select.paging.take) {
            defaultValue = this.extractValue(o, select.paging.take);
        }
        else {
            const takeJoin = select.joins.first(o => o instanceof PagingJoinRelation) as PagingJoinRelation;
            if (takeJoin) {
                if (takeJoin.end) {
                    defaultValue = this.extractValue(o, takeJoin.end);
                    if (takeJoin.start) {
                        defaultValue -= this.extractValue(o, takeJoin.start);
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
            if (sqlParam)
                return sqlParam.value;
        }
        return null;
    }
    protected flattenSelectExpression(selectExp: SelectExpression): SelectExpression[] {
        const results = [selectExp];
        for (let i = 0; i < results.length; i++) {
            const select = results[i];
            const addition = select.resolvedIncludes.select(o => o.child).toArray().reverse();
            results.splice(i + 1, 0, ...addition);
        }
        return results;
    }
    public generateValue(column: IColumnExpression) {
        if (column.columnMeta) {
            const columnMeta = column.columnMeta;
            if (columnMeta.defaultExp)
                return ExpressionExecutor.execute(columnMeta.defaultExp.body);
        }

        switch (column.type) {
            case Uuid:
                return Uuid.new().toString();
            case Number:
                let fix = 2;
                if (column.columnMeta && column.columnMeta instanceof IntegerColumnMetaData)
                    fix = 0;

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
                parameters: parameters,
                type: type
            };
        }
        else {
            command = commandOrQuery;
        }
        const count = (command as BatchedQuery).queryCount || 1;
        return this.results.splice(0, count);
    }

    //#region Abstract Member
    public isolationLevel: IsolationLevel;
    public database: string;
    public get inTransaction(): boolean {
        return this._transactionCount > 0;
    }
    public isOpen: boolean;
    private _transactionCount: number = 0;
    constructor(database?: string) {
        this.database = database || "database";
        [this.errorEvent, this.onError] = EventHandlerFactory(this);
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
    public errorEvent: IEventHandler<MockConnection, Error>;
    protected onError: IEventDispacher<Error>;

    //#endregion
}