import { IQueryResultParser } from "./ResultParser/IQueryResultParser";
import { ParameterBuilder } from "./ParameterBuilder/ParameterBuilder";
import { ICommandQueryExpression } from "../Queryable/QueryExpression/ICommandQueryExpression";

export interface IQueryCache<T = any> {
    commandQuery: ICommandQueryExpression<T>;
    parameterBuilder: ParameterBuilder;
    resultParser?: IQueryResultParser<T>;
}