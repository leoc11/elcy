import type { OrderDirection } from "../../Common/StringType";
import type { GenericType, IObjectType, ValueType } from "../../Common/Type";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import type { IColumnExpression } from "./IColumnExpression";
import { SelectExpression } from "./SelectExpression";

export interface IEntityExpression<TE extends object = any> extends IExpression<TE> {
    alias: string;
    columns: Array<IColumnExpression<TE>>;
    defaultOrders: Array<ArrayValueExpression<((...param: TE[]) => ValueType) | OrderDirection>>;
    deleteColumn?: IColumnExpression<TE, boolean>;
    entityTypes: IObjectType[];
    isRelationData?: boolean;
    name: string;
    schema?: string;
    primaryColumns: Array<IColumnExpression<TE>>;
    select?: SelectExpression<TE, any>;
    type: GenericType<TE>;
    clone(replaceMap?: Map<IExpression, IExpression>): IEntityExpression<TE>;
}
