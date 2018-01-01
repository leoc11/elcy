import { IObjectType } from "../../../Common/Type";
import { QueryBuilder } from "../QueryBuilder";
import { ColumnExpression } from "./ColumnExpression";
import { GroupByExpression } from "./GroupByExpression";
import { TableExpression } from "./TableExpression";

export interface ISelectExpression {
    alias: string;
}
