import { ISqlParameterBuilderItem } from "../QueryBuilder/ParameterBuilder/ISqlParameterBuilderItem";
import { SelectExpression } from "./QueryExpression/SelectExpression";

export interface IBuildResult<T> {
    expression: SelectExpression<T>;
    sqlParameters: ISqlParameterBuilderItem[];
}