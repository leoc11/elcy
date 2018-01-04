import { IObjectType } from "../../../Common/Type";
import { QueryBuilder } from "../QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { GroupByExpression } from "./GroupByExpression";
import { TableExpression } from "./TableExpression";
import { IExpression } from "../../../ExpressionBuilder/Expression/index";

export interface IQueryExpression<T> extends IExpression<T> {
    alias: string;
}
