import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
export interface IQueryVisitParameter {
    selectExpression: SelectExpression;
    scope?: string;
}
