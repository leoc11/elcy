import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
export interface IQueryVisitParameter<T = unknown> {
    scope?: string;
    selectExpression: SelectExpression<T>;
}
