import { GenericType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IEntityExpression } from "./IEntityExpression";

export interface IColumnExpression<TE = any, T = any> extends IExpression<T> {
    alias?: string;
    columnMeta?: IColumnMetaData<TE, T>;
    // TODO: columnName not needed. coz it not available for computed column.
    columnName: string;
    dataPropertyName: string;
    entity: IEntityExpression<TE>;
    isNullable?: boolean;
    isPrimary: boolean;
    propertyName: keyof TE;
    type: GenericType<T>;
    clone(replaceMap?: Map<IExpression, IExpression>): IColumnExpression<TE, T>;
    hashCode(): number;
}
