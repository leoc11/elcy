import { GenericType } from "../../../Common/Type";
import { IColumnExpression } from "./IColumnExpression";
import { IQueryExpression } from "./IQueryExpression";
import { SelectExpression } from "./SelectExpression";

export interface IEntityExpression<T = any> extends IQueryExpression<T> {
    type: GenericType<T>;
    alias: string;
    columns: IColumnExpression[];
    name: string;
    select?: SelectExpression<T>;
    primaryColumns: IColumnExpression[];
}
