import { IQueryResultParser } from "./ResultParser/IQueryResultParser";
import { ParameterBuilder } from "./ParameterBuilder/ParameterBuilder";

export class QueryCache<T = any> {
    constructor(public readonly query: string, public readonly queryParser: IQueryResultParser<T>, public readonly parameterBuilder: ParameterBuilder) {
    }
}