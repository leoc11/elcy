import { IConnection } from "../IConnection";
import { DeferredQuery } from "../../QueryBuilder/DeferredQuery";
import { IQueryResult } from "../../QueryBuilder/IQueryResult";
import { Enumerable } from "../../Enumerable/Enumerable";
import { SelectExpression } from "../../Queryable/QueryExpression/SelectExpression";
import { QueryType, IsolationLevel } from "../../Common/Type";
import { IColumnExpression } from "../../Queryable/QueryExpression/IColumnExpression";
import { InsertExpression } from "../../Queryable/QueryExpression/InsertExpression";
import { UpdateExpression } from "../../Queryable/QueryExpression/UpdateExpression";
import { DeleteExpression } from "../../Queryable/QueryExpression/DeleteExpression";
import { UpsertExpression } from "../../Queryable/QueryExpression/UpsertExpression";
import { UUID } from "../../Data/UUID";
import { TimeSpan } from "../../Data/TimeSpan";
import { IQuery } from "../../QueryBuilder/Interface/IQuery";
import { BatchedQuery } from "../../QueryBuilder/Interface/BatchedQuery";
import { EventHandlerFactory } from "../../Event/EventHandlerFactory";
import { IEventHandler, IEventDispacher } from "../../Event/IEventHandler";
import { ValueExpression } from "../../ExpressionBuilder/Expression/ValueExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { PagingJoinRelation } from "../../Queryable/Interface/PagingJoinRelation";
import { IncludeRelation } from "../../Queryable/Interface/IncludeRelation";
import { StringColumnMetaData } from "../../MetaData/StringColumnMetaData";

const charList = ["a", "a", "i", "i", "u", "u", "e", "e", "o", "o", " ", " ", " ", "h", "w", "l", "r", "y"];
let SelectExpressionType: any;
(async function () {
    SelectExpressionType = (await import("../../Queryable/QueryExpression/SelectExpression")).SelectExpression;
})();
export class MockConnection implements IConnection {
    public deferredQueries: Iterable<DeferredQuery>;
    private _results: IQueryResult[];
    public get results() {
        if (!this._results) {
            this._results = this.generateQueryResult();
        }

        return this._results;
    }
    public set results(value) {
        this._results = value;
    }
    public generateQueryResult() {
        return Enumerable.load(this.deferredQueries)
            .selectMany(o => {
                const command = o.command;
                if (command instanceof SelectExpressionType) {
                    const selects = this.flattenSelectExpression(command as any);
                    const map: Map<SelectExpression, any[]> = new Map();
                    for (const select of selects) {
                        const rows: any[] = [];
                        map.set(select, rows);
                        if (select.parentRelation) {
                            const parentInclude = select.parentRelation as IncludeRelation;
                            const relMap = Enumerable.load(parentInclude.relationMap()).toArray();

                            let parent = parentInclude.parent;
                            while (parent.parentRelation && parent.parentRelation.isEmbedded) {
                                parent = parent.parentRelation.parent;
                            }
                            const parentRows = map.get(parent);

                            const maxRowCount = this.getMaxCount(select, o, 3);

                            Enumerable.load(parentRows).each(parent => {
                                const numberOfRecord = parentInclude.type === "one" ? 1 : Math.floor(Math.random() * maxRowCount) + 1;
                                for (let i = 0; i < numberOfRecord; i++) {
                                    const item = {} as any;
                                    for (const o of select.projectedColumns) {
                                        const columnName = o.alias || o.columnName;
                                        item[columnName] = this.generateValue(o);
                                    }
                                    rows.push(item);

                                    for (const [parentCol, entityCol] of relMap) {
                                        item[entityCol.alias || entityCol.columnName] = parent[parentCol.alias || parentCol.columnName];
                                    }
                                }
                            });
                        }
                        else {
                            const maxRowCount = this.getMaxCount(select, o, 10);
                            const numberOfRecord = Math.floor(Math.random() * maxRowCount) + 1;
                            for (let i = 0; i < numberOfRecord; i++) {
                                const item = {} as any;
                                for (const o of select.projectedColumns) {
                                    const columnName = o.alias || o.columnName;
                                    item[columnName] = this.generateValue(o);
                                }
                                rows.push(item);
                            }
                        }
                    }

                    const generatedResults = Enumerable.load(map.values()).toArray();
                    let i = 0;
                    return o.queries.select(query => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type & QueryType.DML) {
                            const arrayParameter = o.parameters.where(o => !!o.parameter.select).skip(i).first();
                            if (Array.isArray(arrayParameter.value)) {
                                result.effectedRows = arrayParameter.value.length;
                            }
                        }
                        else if (query.type & QueryType.DQL) {
                            const rows = generatedResults[generatedResults.length - (++i)];
                            result.rows = rows;
                            result.effectedRows = rows.length;
                        }
                        return result;
                    });
                }
                else if (command instanceof InsertExpression) {
                    const dmlCount = o.queries.where(o => o.type === QueryType.DML).count();
                    let i = 0;
                    o.queries.select(query => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type === QueryType.DML) {
                            i++;
                            if (i === dmlCount) {
                                result.effectedRows = command.values.length;
                            }
                            else {
                                const arrayParameter = o.parameters.where(o => !!o.parameter.select).skip(i).first();
                                if (Array.isArray(arrayParameter.value)) {
                                    result.effectedRows = arrayParameter.value.length;
                                }
                            }
                        }
                        return result;
                    });
                }
                else if (command instanceof UpdateExpression) {
                    const dmlCount = o.queries.where(o => o.type === QueryType.DML).count();
                    let i = 0;
                    o.queries.select(query => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type === QueryType.DML) {
                            i++;
                            if (i !== dmlCount) {
                                const arrayParameter = o.parameters.where(o => !!o.parameter.select).skip(i).first();
                                if (Array.isArray(arrayParameter.value)) {
                                    result.effectedRows = arrayParameter.value.length;
                                }
                            }
                        }
                        return result;
                    });
                }
                else if (command instanceof DeleteExpression) {
                    const dmlCount = o.queries.where(o => o.type === QueryType.DML).count();
                    let i = 0;
                    o.queries.select(query => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type === QueryType.DML) {
                            i++;
                            if (i !== dmlCount) {
                                const arrayParameter = o.parameters.where(o => !!o.parameter.select).skip(i).first();
                                if (Array.isArray(arrayParameter.value)) {
                                    result.effectedRows = arrayParameter.value.length;
                                }
                            }
                        }
                        return result;
                    });
                }
                else if (command instanceof UpsertExpression) {
                    const dmlCount = o.queries.where(o => o.type === QueryType.DML).count();
                    let i = 0;
                    o.queries.select(query => {
                        const result: IQueryResult = {
                            effectedRows: 1
                        };
                        if (query.type === QueryType.DML) {
                            i++;
                            if (i !== dmlCount) {
                                const arrayParameter = o.parameters.where(o => !!o.parameter.select).skip(i).first();
                                if (Array.isArray(arrayParameter.value)) {
                                    result.effectedRows = arrayParameter.value.length;
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
            return exp.execute();
        }
        else {
            const sqlParam = o.parameters.first(o => o.name === (exp as SqlParameterExpression).name);
            return sqlParam ? sqlParam.value : null;
        }
    }
    protected flattenSelectExpression(selectExp: SelectExpression): SelectExpression[] {
        const results = [selectExp];
        for (let i = 0; i < results.length; i++) {
            const select = results[i];
            const addition = Enumerable.load(select.resolvedIncludes).select(o => o.child).toArray().reverse();
            results.splice(i + 1, 0, ...addition);
        }
        return results;
    }
    public generateValue(column: IColumnExpression) {
        switch (column.type) {
            case UUID:
                return UUID.new().toString();
            case Number:
                return Number((Math.random() * 10000 + 1).toFixed(2));
            case String: {
                let result = "";
                let number = Math.random() * 100 + 1;
                if (column.columnMetaData && column.columnMetaData instanceof StringColumnMetaData && column.columnMetaData.length > 0) {
                    number = column.columnMetaData.length;
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
        }
        return null;
    }
    public async executeQuery(command: IQuery): Promise<IQueryResult[]> {
        console.log(JSON.stringify(command.query));
        const batchedQuery = command as BatchedQuery;
        const count = batchedQuery.queryCount || 0;
        return this.results.splice(0, count);
    }

    //#region Abstract Member
    public isolationLevel: IsolationLevel;
    public database: string;
    public inTransaction: boolean;
    public isOpen: boolean;
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
        return Promise.resolve();
    }
    public commitTransaction(): Promise<void> {
        return Promise.resolve();
    }
    public rollbackTransaction(): Promise<void> {
        return Promise.resolve();
    }
    public setIsolationLevel(isolationLevel: IsolationLevel): Promise<void> {
        return Promise.resolve();
    }
    public errorEvent: IEventHandler<MockConnection, Error>;
    protected onError: IEventDispacher<Error>;

    //#endregion
}