import { DecimalColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IDecimalColumnOption extends IColumnOption<number> {
    precision?: number;
    scale?: number;
    columnType?: DecimalColumnType;
}
