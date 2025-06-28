import { BigIntColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
export interface IBigIntColumnOption extends IColumnOption<BigInt> {
    autoIncrement?: boolean;
    columnType?: BigIntColumnType;
    length?: number;
}
