import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IEntityExpression } from "./IEntityExpression";
import { IQueryExpression } from "./IQueryExpression";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IQueryCommand } from "../../QueryBuilder/Interface/IQueryCommand";

export interface ICommandQueryExpression<T = any> extends IQueryExpression<T[]> {
    entity: IEntityExpression;
    where: IExpression<boolean>;
    clone(): ICommandQueryExpression<T>;
    toQueryCommands(queryBuilder: QueryBuilder): IQueryCommand[];
}
