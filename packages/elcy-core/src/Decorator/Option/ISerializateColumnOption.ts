import { SerializeColumnType } from "../../Common/ColumnType";
import { IObjectType } from "../../Common/Type";
import { IColumnOption } from "./IColumnOption";

export interface ISerializeColumnOption<T> extends IColumnOption<T> {
    columnType?: SerializeColumnType;
    type?: IObjectType<T>;
}
