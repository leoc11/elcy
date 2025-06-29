import { DecimalColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IDecimalColumnOption extends IColumnOption<number> {
    columnType?: DecimalColumnType;
    precision?: number;
    scale?: number;
}
