import { ColumnGeneration, QueryType } from "../Common/Enum";
import { IsolationLevel } from "../Common/StringType";
import { IConnection } from "../Connection/IConnection";
import { TimeSpan } from "../Data/TimeSpan";
import { Uuid } from "../Data/Uuid";
import { IEnumerable } from "../Enumerable/IEnumerable";
import { EventHandlerFactory } from "../Event/EventHandlerFactory";
import { IEventDispacher, IEventHandler } from "../Event/IEventHandler";
import { EqualExpression } from "../ExpressionBuilder/Expression/EqualExpression";
import { IExpression } from "../ExpressionBuilder/Expression/IExpression";
import { StrictEqualExpression } from "../ExpressionBuilder/Expression/StrictEqualExpression";
import { ValueExpression } from "../ExpressionBuilder/Expression/ValueExpression";
import { ExpressionExecutor } from "../ExpressionBuilder/ExpressionExecutor";
import { isNull, visitExpression } from "../Helper/Util";
import { IntegerColumnMetaData } from "../MetaData/IntegerColumnMetaData";
import { StringColumnMetaData } from "../MetaData/StringColumnMetaData";
import { BulkDeferredQuery } from "../Query/DeferredQuery/BulkDeferredQuery";
import { DeferredQuery } from "../Query/DeferredQuery/DeferredQuery";
import { IQuery } from "../Query/IQuery";
import { IQueryResult } from "../Query/IQueryResult";
import { IncludeRelation } from "../Queryable/Interface/IncludeRelation";
import { PagingJoinRelation } from "../Queryable/Interface/PagingJoinRelation";
import { ColumnExpression } from "../Queryable/QueryExpression/ColumnExpression";
import { DeleteExpression } from "../Queryable/QueryExpression/DeleteExpression";
import { IColumnExpression } from "../Queryable/QueryExpression/IColumnExpression";
import { InsertExpression } from "../Queryable/QueryExpression/InsertExpression";
import { InsertIntoExpression } from "../Queryable/QueryExpression/InsertIntoExpression";
import { QueryExpression } from "../Queryable/QueryExpression/QueryExpression";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";
import { UpdateExpression } from "../Queryable/QueryExpression/UpdateExpression";
import { UpsertExpression } from "../Queryable/QueryExpression/UpsertExpression";
import { IMockedDeferredQuery } from "./MockContext";

const charList = ["a", "a", "i", "i", "u", "u", "e", "e", "o", "o", " ", " ", " ", "h", "w", "l", "r", "y"];
export class MockConnection implements IConnection {
    public get inTransaction(): boolean {
        return this._transactions.any();
    }
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

    //#region Abstract Member
    public get isolationLevel() {
        return this._isolationLevel;
    }
    constructor(database?: string) {
        this.database = database || "database";
        [this.errorEvent, this.onError] = EventHandlerFactory(this);
    }
    public database: string;
    public errorEvent: IEventHandler<MockConnection, Error>;
    public isOpen: boolean;
    protected onError: IEventDispacher<Error>;
    private _isolationLevel: IsolationLevel = "READ COMMITTED";
    private _deferredQueries: IEnumerable<DeferredQuery & IMockedDeferredQuery>;
    private _generatedResults: IQueryResult[];
    private _results: IQueryResult[];
    private _transactions: IsolationLevel[] = [];
    public close(): Promise<void> {
        return Promise.resolve();
    }
    public commitTransaction(): Promise<void> {
        this._isolationLevel = this._transactions.pop();
        return Promise.resolve();
    }
    public generateQueryResult() {
        return this._deferredQueries
            .selectMany((def) => {
                if (def instanceof BulkDeferredQuery) {
                    return def.defers.cast<IMockedDeferredQuery>()
                        .selectMany((def1) => def1.queryExps.select((o) => [def1, o]));
                }
                else {
                    return def.queryExps.select((o) => [def, o]);
                }
            })
            .selectMany((o) => {
                const deferred = o[0] as DeferredQuery & IMockedDeferredQuery;
                const command = o[1] as QueryExpression;
                const skipCount = deferred.tvpMap.size;
                const tvps = deferred.tvpMap.asEnumerable().toArray();
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
                                const queryValue = tvps[i][1];
                                if (Array.isArray(queryValue)) {
                                    result.effectedRows = queryValue.length;
                                }
                            }
                        }
                        return result;
                    });
                }
                else if (command instanceof SelectExpression) {
                    const queries = deferred.queries.skip(skipCount * 2).toArray();
                    const selects = this.flattenSelectExpression(command as any);
                    const map: Map<SelectExpression, any[]> = new Map();
                    let qi = 0;
                    for (const select of selects) {
                        const query = queries[qi++];
                        const rows: any[] = [];
                        map.set(select, rows);

                        const propValueMap = {};
                        if (select.where) {
                            visitExpression(select.where, (exp) => {
                                if (exp instanceof EqualExpression || exp instanceof StrictEqualExpression) {
                                    if (exp.leftOperand instanceof ColumnExpression && exp.leftOperand.entity.type === select.entity.type) {
                                        let value = null;
                                        if (exp.rightOperand instanceof ValueExpression) {
                                            value = exp.rightOperand.value;
                                        }
                                        else if (exp.rightOperand instanceof SqlParameterExpression) {
                                            value = query.parameters[exp.rightOperand.name];
                                        }

                                        if (value) {
                                            propValueMap[exp.leftOperand.propertyName] = value;
                                        }
                                    }
                                    else if (exp.rightOperand instanceof ColumnExpression && exp.rightOperand.entity.type === select.entity.type) {
                                        let value = null;
                                        if (exp.leftOperand instanceof ValueExpression) {
                                            value = exp.leftOperand.value;
                                        }
                                        else if (exp.leftOperand instanceof SqlParameterExpression) {
                                            value = query.parameters[exp.leftOperand.name];
                                        }
                                        if (value) {
                                            propValueMap[exp.rightOperand.propertyName] = value;
                                        }
                                    }
                                }
                            });
                        }

                        if (select.parentRelation) {
                            const parentInclude = select.parentRelation as IncludeRelation;
                            const relMap = Array.from(parentInclude.relationMap());

                            let parentExp = parentInclude.parent;
                            while (parentExp.parentRelation && parentExp.parentRelation.isEmbedded) {
                                parentExp = parentExp.parentRelation.parent;
                            }
                            const parentRows = map.get(parentExp);

                            const maxRowCount = this.getMaxCount(select, query, 3);

                            for (const parent of parentRows) {
                                const numberOfRecord = parentInclude.type === "one" ? 1 : Math.floor(Math.random() * maxRowCount) + 1;
                                for (let i = 0; i < numberOfRecord; i++) {
                                    const item = {} as any;
                                    for (const col of select.projectedColumns) {
                                        item[col.dataPropertyName] = this.generateValue(col);
                                    }
                                    for (const prop in propValueMap) {
                                        item[prop] = propValueMap[prop];
                                    }
                                    rows.push(item);

                                    for (const [parentCol, entityCol] of relMap) {
                                        item[entityCol.propertyName] = parent[parentCol.propertyName];
                                    }
                                }
                            }
                        }
                        else {
                            const maxRowCount = this.getMaxCount(select, query, 10);
                            const numberOfRecord = Math.floor(Math.random() * maxRowCount) + 1;
                            for (let i = 0; i < numberOfRecord; i++) {
                                const item = {} as any;
                                for (const col of select.projectedColumns) {
                                    item[col.dataPropertyName] = this.generateValue(col);
                                }
                                for (const prop in propValueMap) {
                                    item[prop] = propValueMap[prop];
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
                            if (tvps[index]) {
                                const paramValue = tvps[index][1];
                                if (Array.isArray(paramValue)) {
                                    result.effectedRows = paramValue.length;
                                }
                            }
                        }
                        else if (query.type & QueryType.DQL) {
                            const rows = generatedResults[index++];
                            result.rows = rows;
                        }
                        return result;
                    });
                }
                else if (command instanceof InsertExpression) {
                    let i = 0;
                    const generatedColumns = command.entity.columns.where((col) => !isNull(col.columnMeta))
                        .where((col) => (col.columnMeta!.generation & ColumnGeneration.Insert) !== 0 || !!col.columnMeta!.defaultExp).toArray();

                    return deferred.queries.select((query) => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        i++;
                        if (query.type & QueryType.DQL) {
                            const rows = command.values.select((v) => {
                                const val: { [key in any]: any } = {};
                                for (const col of generatedColumns) {
                                    const paramExp = v[col.dataPropertyName] as SqlParameterExpression;
                                    val[col.dataPropertyName] = paramExp ? query.parameters[paramExp.name]
                                        : this.generateValue(col);
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
                                const paramValue = tvps[i][1];
                                if (Array.isArray(paramValue)) {
                                    result.effectedRows = paramValue.length;
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
                                const paramValue = tvps[i][1];
                                if (Array.isArray(paramValue)) {
                                    result.effectedRows = paramValue.length;
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
                                const paramValue = tvps[i][1];
                                if (Array.isArray(paramValue)) {
                                    result.effectedRows = paramValue.length;
                                }
                            }
                        }
                        return result;
                    });
                }
                else if (command instanceof UpsertExpression) {
                    const dmlCount = deferred.queries.where((query) => (query.type & QueryType.DML) !== 0).count();
                    let i = 0;
                    return deferred.queries.select((query) => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type & QueryType.DML) {
                            i++;
                            if (i !== dmlCount) {
                                const paramValue = tvps[i][1];
                                if (Array.isArray(paramValue)) {
                                    result.effectedRows = paramValue.length;
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
    public open(): Promise<void> {
        return Promise.resolve();
    }
    public async query(...commands: IQuery[]): Promise<IQueryResult[]> {
        const count = commands.length || 1;
        return this.results.splice(0, count);
    }
    public reset(): Promise<void> {
        return Promise.resolve();
    }
    public rollbackTransaction(): Promise<void> {
        this._isolationLevel = this._transactions.pop();
        return Promise.resolve();
    }
    public setIsolationLevel(isolationLevel: IsolationLevel): Promise<void> {
        this._isolationLevel = isolationLevel;
        return Promise.resolve();
    }
    public setQueries(deferredQueries: Array<DeferredQuery & IMockedDeferredQuery>) {
        this._deferredQueries = deferredQueries;
        this._generatedResults = null;
    }
    public startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        this._transactions.push(this._isolationLevel);
        this.setIsolationLevel(isolationLevel);
        return Promise.resolve();
    }
    protected extractValue(query: IQuery, exp: IExpression) {
        if (exp instanceof ValueExpression) {
            return ExpressionExecutor.execute(exp);
        }
        else if (query.parameters && exp instanceof SqlParameterExpression) {
            const value = query.parameters[exp.name];
            if (value !== undefined) {
                return value;
            }
        }
        return null;
    }
    protected flattenSelectExpression(selectExp: SelectExpression): SelectExpression[] {
        const results = [selectExp];
        for (let i = 0; i < results.length; i++) {
            const select = results[i];
            const addition = select.resolvedIncludes.select((o) => o.child).toArray();
            results.splice(i + 1, 0, ...addition);
        }
        return results;
    }

    protected getMaxCount(select: SelectExpression, query: IQuery, defaultValue = 10) {
        if (select.paging && select.paging.take) {
            defaultValue = this.extractValue(query, select.paging.take);
        }
        else {
            const takeJoin = select.joins.first((o) => o instanceof PagingJoinRelation) as PagingJoinRelation;
            if (takeJoin) {
                if (takeJoin.end) {
                    defaultValue = this.extractValue(query, takeJoin.end);
                    if (takeJoin.start) {
                        defaultValue -= this.extractValue(query, takeJoin.start);
                    }
                }
            }
        }

        return defaultValue;
    }

    //#endregion
}
