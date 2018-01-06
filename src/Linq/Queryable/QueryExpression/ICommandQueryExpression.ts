import { IEntityExpression } from "./IEntityExpression";
import { IQueryExpression } from "./IQueryExpression";

export interface ICommandQueryExpression<T = any> extends IQueryExpression<T> {
    entity: IEntityExpression;
}
