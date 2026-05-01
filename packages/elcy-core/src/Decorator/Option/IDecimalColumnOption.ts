import type Decimal from "decimal.js";
import { DecimalColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IDecimalColumnOption extends IColumnOption<number | Decimal> {
    columnType?: DecimalColumnType;
    precision?: number;
    scale?: number;
}
