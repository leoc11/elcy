import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
export interface IQueryVisitParameter {
    scope?: string;
    selectExpression: SelectExpression;
}
