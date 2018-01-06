import { IObjectType } from "../../../Common/Type";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryExpression } from "./IQueryExpression";

export interface IEntityExpression<T = any> extends IQueryExpression<T> {
    type: IObjectType<T>;
    alias: string;
    columns: IColumnExpression[];
    has<TE>(type: IObjectType<TE>): boolean;
    get<TE>(type: IObjectType<TE>): IEntityExpression<TE>;
}
