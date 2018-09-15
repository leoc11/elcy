import { ISqlParameterBuilderItem } from "./ParameterBuilder/ISqlParameterBuilderItem";
import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";

export interface IBuildResult<T> {
    expression: SelectExpression<T>;
    sqlParameters: ISqlParameterBuilderItem[];
}