import { GenericType, IObjectType } from "../../Common/Type";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryExpression } from "./IQueryExpression";
import { SelectExpression } from "./SelectExpression";
import { IOrderExpression } from "./IOrderExpression";

export interface IEntityExpression<T = any> extends IQueryExpression<T> {
    type: GenericType<T>;
    alias: string;
    columns: IColumnExpression<T>[];
    name: string;
    select?: SelectExpression<T>;
    primaryColumns: IColumnExpression[];
    defaultOrders: IOrderExpression[];
    deleteColumn?: IColumnExpression<T>;
    clone(): IEntityExpression<T>;
    entityTypes: IObjectType[];
}
