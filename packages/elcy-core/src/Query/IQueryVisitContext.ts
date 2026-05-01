import { SelectExpression } from "../Queryable/QueryExpression/SelectExpression";
export interface IQueryVisitContext {
    scope?: string;
    selectExpression: SelectExpression;
}
