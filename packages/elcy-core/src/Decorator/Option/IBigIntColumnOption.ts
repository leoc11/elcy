import { IntColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IBigIntColumnOption extends IColumnOption<bigint> {
    autoIncrement?: boolean;
    columnType?: IntColumnType;
    length?: number;
}
