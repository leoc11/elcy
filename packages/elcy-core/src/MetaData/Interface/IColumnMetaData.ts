
import { ColumnType } from "../../Common/ColumnType";
import { ColumnGeneration } from "../../Common/Enum";
import type { GenericType, StringKeyOf } from "../../Common/Type";
import { IColumnOption } from "../../Decorator/Option/IColumnOption";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { IEntityMetaData } from "./IEntityMetaData";

export interface IColumnMetaData<TE extends object = object, T = unknown> {
    charset?: string;
    collation?: string;
    columnName?: string;
    columnType?: ColumnType;
    defaultExp?: FunctionExpression<T>;
    description?: string;
    entity?: IEntityMetaData<TE>;
    generation?: ColumnGeneration;
    indexed?: boolean;
    isPrimaryColumn?: boolean;
    isProjected?: boolean;
    isReadOnly?: boolean;
    nullable?: boolean;
    propertyName?: StringKeyOf<TE>;
    type?: GenericType<T>;
    applyOption?(option: IColumnMetaData | IColumnOption): void;
}
