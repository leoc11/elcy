
import { ColumnType } from "../../Common/ColumnType";
import { GenericType } from "../../Common/Type";
import { IEntityMetaData } from "./IEntityMetaData";
import { IColumnOption } from "../../Decorator/Option/IColumnOption";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
export interface IColumnMetaData<TE = any, T = any> {
    entity?: IEntityMetaData<TE>;
    columnName?: string;
    propertyName?: keyof TE;
    indexed?: boolean;
    nullable?: boolean;
    default?: FunctionExpression<void, T>;
    type?: GenericType<T>;
    description?: string;
    columnType?: ColumnType;
    collation?: string;
    charset?: string;
    isCreatedDate?: boolean;
    isModifiedDate?: boolean;
    isDeleteColumn?: boolean;
    isPrimaryColumn?: boolean;
    applyOption?(option: IColumnMetaData | IColumnOption): void;
}
