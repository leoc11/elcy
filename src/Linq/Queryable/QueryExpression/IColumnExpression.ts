import { GenericType } from "../../../Common/Type";
import { IEntityExpression } from "./IEntityExpression";
import { IQueryExpression } from "./IQueryExpression";

export interface IColumnExpression<T = any, TE = any> extends IQueryExpression<T> {
    type: GenericType<T>;
    alias?: string;
    entity: IEntityExpression<TE>;
    property: string;
    clone(): IColumnExpression<T, TE>;
}
