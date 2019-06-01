import { DbContext } from "../Data/DbContext";
import { Enumerable } from "../Enumerable/Enumerable";
import { hashCode } from "../Helper/Util";
import { Diagnostic } from "../Logger/Diagnostic";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQuery } from "./IQuery";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryOption } from "./IQueryOption";
import { IQueryParameterMap } from "./IQueryParameter";
import { IQueryResult } from "./IQueryResult";

export class DeferredQuery<T = any> {
    public get queries() {
        return this._queries.slice();
    }
    constructor(
        protected readonly dbContext: DbContext,
        public readonly command: IQueryExpression,
        public readonly parameters: IQueryParameterMap,
        public readonly resultParser: (result: IQueryResult[], queryCommands?: IQuery[]) => T,
        public readonly queryOption: IQueryOption
    ) { }
    public resolver: (value?: T | PromiseLike<T>) => void;
    public value: T;
    private _queries: IQuery[] = [];
    public buildQuery(queryBuilder: IQueryBuilder) {
        const timer = Diagnostic.timer();
        this._queries = queryBuilder.toQuery(this.command, this.parameters, this.queryOption);

        if (Diagnostic.enabled) {
            Diagnostic.debug(this, `Build Query.`, this._queries);
            Diagnostic.trace(this, `Build Query time: ${timer.time()}ms`);
        }
        return this._queries;
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

        await this.dbContext.executeDeferred();
        return this.value;
    }
    public hashCode() {
        return this.command.hashCode() + Enumerable.from(this.parameters).select((o) => hashCode((o[1].value || "NULL").toString())).sum();
    }
    public resolve(result: IQueryResult[]) {
        this.value = this.resultParser(result, this._queries);
        if (this.resolver) {
            this.resolver(this.value);
            this.resolver = undefined;
        }
    }
    public toString() {
        return this.buildQuery(this.dbContext.queryBuilder).select((o) => o.query).toArray().join(";\n\n");
    }
}
