import { ApproximateNumericColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IApproximateNumericColumnOption extends IColumnOption<number> {
    precision?: number;
    scale?: number;
    columnType?: ApproximateNumericColumnType;
}
