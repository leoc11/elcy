import { IQueryCommand } from "./Interface/IQueryCommand";
import { DbContext } from "../Data/DBContext";
import { IQueryResult } from "./QueryResult";

export class DeferredQuery<T = any> {
    value: T;
    constructor(protected readonly context: DbContext, public readonly commands: IQueryCommand[], public readonly parameters: Map<string, any>, public readonly resultParser: (result: IQueryResult[]) => T) {
        this.context.deferredQueries.add(this);
    }
    public async execute(): Promise<T> {
        let comands: IQueryCommand[] = [];
        let params = new Map<string, any>();
        if (this.value !== undefined) {
            return this.value;
        }

        const deferredQueries = this.context.deferredQueries.splice(0);
        for (const deferredQuery of deferredQueries) {
            comands = comands.concat(deferredQuery.commands);
            if (deferredQuery.parameters)
                params = new Map([...params, ...deferredQuery.parameters]);
        }
        const queryResult = await this.context.executeCommands(comands, params);
        for (const deferredQuery of deferredQueries) {
            deferredQuery.value = deferredQuery.resultParser(queryResult);
        }
        return this.value;
    }
}