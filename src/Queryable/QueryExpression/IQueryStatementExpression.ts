import { SqlParameterExpression } from "../../ExpressionBuilder/Expression/SqlParameterExpression";
import { IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IQueryOption } from "../../Queryable/QueryExpression/IQueryOption";

export interface IQueryExpression<T = any> extends IExpression<T[]> {
    clone(replaceMap?: Map<IExpression, IExpression>): IQueryExpression<T>;
    parameters: SqlParameterExpression[];
    option?: IQueryOption;
    getEffectedEntities(): IObjectType[];
}
