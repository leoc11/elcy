import { GenericType, StringKeyOf, ValueType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IEntityExpression } from "./IEntityExpression";

// TODO: should be implemented as uninary expression
export interface IColumnExpression<TE = any, T = ValueType> extends IExpression<T> {
    alias?: string;
    columnMeta?: IColumnMetaData<Extract<TE, object>, T>;
    columnName: string;
    dataPropertyName: string;
    entity: IEntityExpression<TE>;
    isNullable?: boolean;
    isPrimary: boolean;
    propertyName: StringKeyOf<TE>;
    type: GenericType<T>;
    hashCode(): number;
}
