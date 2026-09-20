import type { OrderDirection } from "../../Common/StringType";
import type { GenericType, IObjectType, ValueType } from "../../Common/Type";
import { ArrayValueExpression } from "../../ExpressionBuilder/Expression/ArrayValueExpression";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { JoinRelation } from "../Interface/JoinRelation";
import type { IColumnExpression } from "./IColumnExpression";

export interface IEntityExpression<TE = unknown> extends IExpression<TE> {
    alias: string;
    properties: { [K in keyof TE]?: IColumnExpression<TE> };
    defaultOrders: Array<ArrayValueExpression<((...param: TE[]) => ValueType) | OrderDirection>>;
    deleteColumn?: IColumnExpression<TE, boolean>;
    entityTypes: IObjectType[];
    isRelationData?: boolean;
    name: string;
    schema?: string;
    primaryColumns: Array<IColumnExpression<TE>>;
    type: GenericType<TE>;
    parentJoin?: JoinRelation<any, TE>;
}
