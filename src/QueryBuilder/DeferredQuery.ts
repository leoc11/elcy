import { DbContext } from "../Data/DBContext";
import { IQueryResult } from "./IQueryResult";
import { ICommandQueryExpression } from "../Queryable/QueryExpression/ICommandQueryExpression";
import { ISqlParameter } from "./ISqlParameter";
import { QueryBuilder } from "./QueryBuilder";
import { IQueryCommand } from "./Interface/IQueryCommand";

export class DeferredQuery<T = any> {
    public value: T;
    public resolver: (value?: T | PromiseLike<T>) => void;
    protected queryCommands: IQueryCommand[] = [];
    constructor(protected readonly dbContext: DbContext, public readonly command: ICommandQueryExpression, public readonly parameters: ISqlParameter[], public readonly resultParser: (result: IQueryResult[], queryCommands?: IQueryCommand[]) => T) {
    }
    public resolve(bacthResult: IQueryResult[]) {
        const result = bacthResult.splice(0, this.queryCommands.length);
        this.value = this.resultParser(result, this.queryCommands);
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
        this.queryCommands = this.command.toQueryCommands(queryBuilder, this.parameters);
        return this.queryCommands;
    }
    public toString() {
        return this.buildQuery(this.dbContext.queryBuilder).select(o => o.query).toArray().join(";\n\n");
    }
}