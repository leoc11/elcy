import { GenericType } from "../../../Common/Type";
import { IEntityExpression } from "./IEntityExpression";
import { IQueryExpression } from "./IQueryExpression";
import { IColumnOption } from "../../../Decorator/Option/IColumnOption";
import { ColumnType } from "../../../Common/ColumnType";

export interface IColumnExpression<TE = any, T = any> extends IQueryExpression<T> {
    type: GenericType<T>;
    alias?: string;
    columnName: string;
    columnType: ColumnType;
    columnMetaData?: IColumnOption<T>;
    entity: IEntityExpression<TE>;
    propertyName: string;
    isPrimary: boolean;
    isShadow?: boolean;
    clone(): IColumnExpression<TE, T>;
}
