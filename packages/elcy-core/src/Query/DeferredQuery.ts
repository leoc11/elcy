import { DbContext } from "../Data/DbContext";
import { Enumerable } from "@elcy/enumerable";
import { hashCode } from "../Helper/Hash";
import { Diagnostic } from "../Logger/Diagnostic";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQuery } from "./IQuery";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryOption } from "./IQueryOption";
import { ISqlParameterValueMap } from "./IQueryParameter";
import { IQueryResult } from "./IQueryResult";

export class DeferredQuery<T = unknown> {
    public get queries() {
        return this._queries.slice();
    }
    constructor(
        protected readonly dbContext: DbContext,
        public readonly command: IQueryExpression,
        public readonly parameters: ISqlParameterValueMap,
        public readonly resultParser: (result: Map<IQuery, IQueryResult>) => T,
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
        if (!this.dbContext.deferredQueries.includes(this)) {
            return new Promise<T>((resolve) => {
                this.resolver = resolve;
            });
        }

        await this.dbContext.executeDeferred();
        return this.value;
    }
    public hashCode() {
        return this.command.hashCode() + Enumerable.from(this.parameters).map((o) => hashCode((o[1].value || "NULL").toString())).sum();
    }
    public resolve(result: IQueryResult[]) {
        const resultMap = Enumerable.from(this._queries).toMap(o => o, o => result[this._queries.indexOf(o)]);
        this.value = this.resultParser(resultMap);
        if (this.resolver) {
            this.resolver(this.value);
            this.resolver = undefined;
        }
    }
    public toString() {
        return this.buildQuery(this.dbContext.queryBuilder).map((o) => o.query).join(";\n\n");
    }
}
