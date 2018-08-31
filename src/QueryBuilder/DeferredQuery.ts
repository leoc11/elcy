import { DbContext } from "../Data/DBContext";
import { IQueryResult } from "./IQueryResult";
import { IQueryCommandExpression } from "../Queryable/QueryExpression/IQueryCommandExpression";
import { ISqlParameter } from "./ISqlParameter";
import { QueryBuilder } from "./QueryBuilder";
import { IQuery } from "./Interface/IQuery";
import { Diagnostic } from "../Logger/Diagnostic";
import { hashCode } from "../Helper/Util";
import { IQueryOption, ISelectQueryOption } from "./Interface/IQueryOption";

export class DeferredQuery<T = any> {
    public value: T;
    public resolver: (value?: T | PromiseLike<T>) => void;
    private _queryCommands: IQuery[] = [];
    public get queryCommands() {
        return this._queryCommands.slice();
    }
    public options: IQueryOption;
    constructor(protected readonly dbContext: DbContext, public readonly command: IQueryCommandExpression, public readonly parameters: ISqlParameter[], public readonly resultParser: (result: IQueryResult[], queryCommands?: IQuery[]) => T, options: IQueryOption) {
        this.options = options;
    }
    public resolve(result: IQueryResult[]) {
        this.value = this.resultParser(result, this._queryCommands);
        if (this.resolver) {
            this.resolver(this.value);
            this.resolver = undefined;
        }
    }
    public async execute(): Promise<T> {
        // if has been resolved, return
        if (this.value !== undefined) {
            return this.value;
        }
        // if being resolved.
        if (!this.dbContext.deferredQueries.contains(this)) {
            return new Promise<T>((resolve) => {
                this.resolver = resolve;
            });
        }

        const deferredQueries = this.dbContext.deferredQueries.splice(0);
        await this.dbContext.executeDeferred(deferredQueries);
        return this.value;
    }
    public buildQuery(queryBuilder: QueryBuilder) {
        const timer = Diagnostic.timer();
        this._queryCommands = this.command.toQueryCommands(queryBuilder, this.parameters);
        if (Diagnostic.enabled) {
            Diagnostic.debug(this, `Build Query.`, this._queryCommands);
            Diagnostic.trace(this, `Build Query time: ${timer.time()}ms`);
        }
        return this._queryCommands;
    }
    public toString() {
        return this.buildQuery(this.dbContext.queryBuilder).select(o => o.query).toArray().join(";\n\n");
    }
    public hashCode() {
        return this.command.hashCode() + this.parameters.select(o => hashCode((o.value || "NULL").toString())).sum();
    }
}