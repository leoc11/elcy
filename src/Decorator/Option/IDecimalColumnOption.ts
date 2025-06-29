import Decimal from "decimal.js-light";
import { DecimalColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IDecimalColumnOption extends IColumnOption<Decimal> {
    columnType?: DecimalColumnType;
    precision?: number;
    scale?: number;
}
