import { DateColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
import { DateValueType } from "src/Common/Type";

export interface IDateColumnOption<T extends DateValueType> extends IColumnOption<T> {
    columnType?: DateColumnType;
    precision?: number;
}
