import type { OrderDirection } from "../../Common/StringType";
import type { GenericType, IObjectType, ValueType } from "../../Common/Type";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import type { IColumnExpression } from "./IColumnExpression";
import { SelectExpression } from "./SelectExpression";

export interface IEntityExpression<T extends object = object> extends IExpression<T> {
    alias: string;
    columns: Array<IColumnExpression<T>>;
    defaultOrders: Array<ArrayValueExpression<((...param: T[]) => ValueType) | OrderDirection>>;
    deleteColumn?: IColumnExpression<T>;
    entityTypes: IObjectType[];
    isRelationData?: boolean;
    name: string;
    primaryColumns: Array<IColumnExpression<T>>;
    select?: SelectExpression<T>;
    type: GenericType<T>;
    clone(replaceMap?: Map<IExpression, IExpression>): IEntityExpression<T>;
}
