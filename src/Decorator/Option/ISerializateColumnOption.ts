import { SerializeColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
import { GenericType } from "../../Common/Type";

export interface ISerializeColumnOption<T> extends IColumnOption<T> {
    columnType?: SerializeColumnType;
    type?: GenericType<T>;
}
