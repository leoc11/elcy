import { GenericType, IObjectType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IOrderQueryDefinition } from "../Interface/IOrderQueryDefinition";
import { IColumnExpression } from "./IColumnExpression";
import { SelectExpression } from "./SelectExpression";

export interface IEntityExpression<T = any> extends IExpression<T> {
    alias: string;
    columns: Array<IColumnExpression<T>>;
    defaultOrders: Array<IOrderQueryDefinition<T>>;
    deleteColumn?: IColumnExpression<T>;
    entityTypes: IObjectType[];
    isRelationData?: boolean;
    name: string;
    primaryColumns: Array<IColumnExpression<T>>;
    select?: SelectExpression<T>;
    type: GenericType<T>;
    clone(replaceMap?: Map<IExpression, IExpression>): IEntityExpression<T>;
}
