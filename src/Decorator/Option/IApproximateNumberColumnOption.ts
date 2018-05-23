import { ApproximateNumberColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IApproximateNumberColumnOption extends IColumnOption<number> {
    precision?: number;
    scale?: number;
    columnType?: ApproximateNumberColumnType;
}
