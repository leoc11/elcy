import { QueryType } from "../Common/Enum";
import { INodeTree } from "../Common/ParameterStack";
import { SqlParameterExpression } from "../Queryable/QueryExpression/SqlParameterExpression";

export interface IQueryTemplate {
    comment?: string;
    parameterTree: INodeTree<SqlParameterExpression[]>;
    query: string;
    type: QueryType;
}
