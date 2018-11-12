import { GenericType, IObjectType } from "../../Common/Type";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryExpression } from "./IQueryExpression";
import { SelectExpression } from "./SelectExpression";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IOrderQueryDefinition } from "../Interface/IOrderQueryDefinition";

export interface IEntityExpression<T = any> extends IQueryExpression<T> {
    type: GenericType<T>;
    alias: string;
    columns: IColumnExpression<T>[];
    name: string;
    select?: SelectExpression<T>;
    primaryColumns: IColumnExpression[];
    defaultOrders: IOrderQueryDefinition<T>[];
    deleteColumn?: IColumnExpression<T>;
    clone(replaceMap?: Map<IExpression, IExpression>): IEntityExpression<T>;
    entityTypes: IObjectType[];
    isRelationData?: boolean;
}
