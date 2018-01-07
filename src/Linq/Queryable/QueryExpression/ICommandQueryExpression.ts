import { IExpression } from "../../../ExpressionBuilder/Expression";
import { IEntityExpression } from "./IEntityExpression";
import { IQueryExpression } from "./IQueryExpression";

export interface ICommandQueryExpression<T = any> extends IQueryExpression<T> {
    entity: IEntityExpression;
    where: IExpression<boolean>;
    replaceEntity(source: IEntityExpression, target: IEntityExpression): void;
}
