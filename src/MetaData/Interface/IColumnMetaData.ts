
import { ColumnType } from "../../Common/ColumnType";
import { ColumnGeneration, GenericType } from "../../Common/Type";
import { IColumnOption } from "../../Decorator/Option/IColumnOption";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { IEntityMetaData } from "./IEntityMetaData";
export interface IColumnMetaData<TE = any, T = any> {
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
    propertyName?: keyof TE;
    type?: GenericType<T>;
    applyOption?(option: IColumnMetaData | IColumnOption): void;
}
