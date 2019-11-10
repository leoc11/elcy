import { DbContext } from "../../Data/DbContext";
import { IQuery } from "../IQuery";
import { IQueryResult } from "../IQueryResult";
import { DeferredQuery } from "./DeferredQuery";

export class BulkDeferredQuery<T = any> extends DeferredQuery<T[]> {
    constructor(
        protected readonly dbContext: DbContext,
        protected readonly defers: Array<DeferredQuery<T>>
    ) {
        super(dbContext, null);
        for (const def of this.defers) {
            dbContext.deferredQueries.delete(def);
        }
    }
    public get queries(): IQuery[] {
        return this.defers.selectMany((o) => o.queries).toArray();
    }
    public hashCode(): number {
        return this.defers.select((o) => o.hashCode()).sum();
    }
    protected resultParser(results: IQueryResult[]): T[] {
        const res = [];
        let i = 0;
        for (const defer of this.defers) {
            defer.resolve(results.slice(i, i + defer.queries.length - 1));
            res.push(defer.value);
            i += defer.queries.length;
        }
        return res;
    }
}
