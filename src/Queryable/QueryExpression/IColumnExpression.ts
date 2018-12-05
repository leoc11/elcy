import { GenericType } from "../../Common/Type";
import { IEntityExpression } from "./IEntityExpression";
import { IQueryExpression } from "./IQueryExpression";
import { ColumnType } from "../../Common/ColumnType";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

export interface IColumnExpression<TE = any, T = any> extends IQueryExpression<T> {
    type: GenericType<T>;
    alias?: string;
    columnName: string;
    columnType?: ColumnType;
    columnMetaData?: IColumnMetaData<TE, T>;
    entity: IEntityExpression<TE>;
    propertyName: keyof TE;
    isPrimary: boolean;
    isNullable?: boolean;
    clone(replaceMap?: Map<IExpression, IExpression>): IColumnExpression<TE, T>;
    hashCode(): number;
}
