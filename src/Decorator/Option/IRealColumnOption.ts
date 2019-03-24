import { RealColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IRealColumnOption extends IColumnOption<number> {
    size?: number;
    columnType?: RealColumnType;
}
