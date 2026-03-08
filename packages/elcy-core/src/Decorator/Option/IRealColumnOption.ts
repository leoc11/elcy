import { RealColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IRealColumnOption extends IColumnOption<number> {
    columnType?: RealColumnType;
    size?: number;
}
