
import { ColumnType } from "../../Common/ColumnType";
import { ColumnGeneration, GenericType } from "../../Common/Type";
import { IColumnOption } from "../../Decorator/Option/IColumnOption";
import { FunctionExpression } from "../../ExpressionBuilder/Expression/FunctionExpression";
import { IEntityMetaData } from "./IEntityMetaData";
export interface IColumnMetaData<TE = any, T = any> {
    entity?: IEntityMetaData<TE>;
    columnName?: string;
    propertyName?: keyof TE;
    type?: GenericType<T>;
    indexed?: boolean;
    nullable?: boolean;
    defaultExp?: FunctionExpression<T>;
    description?: string;
    columnType?: ColumnType;
    collation?: string;
    charset?: string;
    isReadOnly?: boolean;
    isPrimaryColumn?: boolean;
    isProjected?: boolean;
    generation?: ColumnGeneration;
    applyOption?(option: IColumnMetaData | IColumnOption): void;
}
