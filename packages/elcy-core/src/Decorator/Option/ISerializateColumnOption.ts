import { SerializeColumnType } from "../../Common/ColumnType";
import { GenericType } from "../../Common/Type";
import { IColumnOption } from "./IColumnOption";

export interface ISerializeColumnOption<T> extends IColumnOption<T> {
    columnType?: SerializeColumnType;
    type?: GenericType<T>;
}
