import { IObjectType } from "../../../Common/Type";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryExpression } from "./IQueryExpression";

export interface IEntityExpression<T = any> extends IQueryExpression<T> {
    type: IObjectType<T>;
    alias: string;
    columns: IColumnExpression[];
}
