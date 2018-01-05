import { genericType } from "../../../Common/Type";
import { IEntityExpression } from "./IEntityExpression";
import { IQueryExpression } from "./IQueryExpression";

export interface IColumnExpression<T = any, TE = any> extends IQueryExpression<T> {
    type: genericType<T>;
    alias?: string;
    entity: IEntityExpression<TE>;
}
