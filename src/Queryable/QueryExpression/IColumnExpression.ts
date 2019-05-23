import { GenericType } from "../../Common/Type";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { IEntityExpression } from "./IEntityExpression";

export interface IColumnExpression<TE = any, T = any> extends IExpression<T> {
    type: GenericType<T>;
    alias?: string;
    // TODO: columnName not needed. coz it not available for computed column.
    columnName: string;
    dataPropertyName: string;
    columnMeta?: IColumnMetaData<TE, T>;
    entity: IEntityExpression<TE>;
    propertyName: keyof TE;
    isPrimary: boolean;
    isNullable?: boolean;
    clone(replaceMap?: Map<IExpression, IExpression>): IColumnExpression<TE, T>;
    hashCode(): number;
}
