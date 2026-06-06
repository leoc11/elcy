import { DecimalColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
import { DecimalValueType } from "src/Common/Type";
export interface IDecimalColumnOption<T extends DecimalValueType> extends IColumnOption<T> {
    columnType?: DecimalColumnType;
    precision?: number;
    scale?: number;
}
