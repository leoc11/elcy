import { DataSerializationColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
import { GenericType } from "../../Common/Type";

export interface IDataSerializationColumnOption<T> extends IColumnOption<T> {
    columnType?: DataSerializationColumnType;
    type?: GenericType<T>;
}
