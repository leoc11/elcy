import { IQueryResultParser } from "./ResultParser/IQueryResultParser";
import { ParameterBuilder } from "./ParameterBuilder/ParameterBuilder";
import { IQueryCommand } from "./Interface/IQueryCommand";

export class QueryCache<T = any> {
    constructor(public readonly queryCommands: IQueryCommand[], public readonly queryParser: IQueryResultParser<T>, public readonly parameterBuilder: ParameterBuilder) {
    }
}