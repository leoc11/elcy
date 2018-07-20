import { IQueryCommand } from "./Interface/IQueryCommand";
import { DbContext } from "../Data/DBContext";
import { IQueryResult } from "./QueryResult";

export class DeferredQuery<T = any> {
    public value: T;
    public resolver: (value?: T | PromiseLike<T>) => void;
    constructor(protected readonly context: DbContext, public readonly commands: IQueryCommand[], public readonly parameters: { [key: string]: any }, public readonly resultParser: (result: IQueryResult[]) => T) {
        this.context.deferredQueries.add(this);
    }
    public resolveValue(value: T) {
        this.value = value;
        if (this.resolver) {
            this.resolver(value);
            this.resolver = undefined;
        }
    }
    public async execute(): Promise<T> {
        let comands: IQueryCommand[] = [];
        let params: { [key: string]: any } = {};

        // if has been resolved, return
        if (this.value !== undefined) {
            return this.value;
        }
        // if being resolved.
        if (!this.context.deferredQueries.contains(this)) {
            return new Promise<T>((resolve, reject) => {
                this.resolver = resolve;
            });
        }

        const deferredQueries = this.context.deferredQueries.splice(0);
        for (const deferredQuery of deferredQueries) {
            comands = comands.concat(deferredQuery.commands);
            if (deferredQuery.parameters)
                params = Object.assign(params, deferredQuery.parameters);
        }
        const queryResult = await this.context.executeCommands(comands, params);
        for (const deferredQuery of deferredQueries) {
            deferredQuery.resolveValue(deferredQuery.resultParser(queryResult));
        }
        return this.value;
    }
}