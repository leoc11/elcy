import { DbContext } from "../Data/DbContext";
import { Enumerable } from "@elcy/enumerable";
import { hashCode } from "../Helper/Util";
import { IQueryExpression } from "../Queryable/QueryExpression/IQueryExpression";
import { IQuery } from "./IQuery";
import { IQueryBuilder } from "./IQueryBuilder";
import { IQueryOption } from "./IQueryOption";
import { IQueryParameterMap } from "./IQueryParameter";
import { IQueryResult } from "./IQueryResult";
import { DeferredQuery } from "./DeferredQuery";

export class DeferredRawQuery<T = unknown> extends DeferredQuery<T> {
    public override get queries() {
        return [this.query];
    }

    constructor(
        protected readonly dbContext: DbContext,
        protected readonly query: IQuery,
        public readonly command: IQueryExpression,
        public readonly parameters: IQueryParameterMap,
        public readonly resultParser: (result: IQueryResult[], queryCommands?: IQuery[]) => T,
        public readonly queryOption: IQueryOption
    ) {
        super(dbContext, command, parameters, resultParser, queryOption);
    }
    public override buildQuery(_: IQueryBuilder) {
        return this.queries;
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
        return this.command.hashCode() + Enumerable.from(this.parameters).select((o) => hashCode((o[1].value || "NULL").toString())).sum();
    }
    public resolve(result: IQueryResult[]) {
        this.value = this.resultParser(result, this.queries);
        if (this.resolver) {
            this.resolver(this.value);
            this.resolver = undefined;
        }
    }
    public toString() {
        return this.query.query;
    }
}
