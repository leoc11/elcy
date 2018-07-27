import { BooleanColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
// tslint:disable-next-line:ban-types
export interface IBooleanColumnOption extends IColumnOption<boolean> {
    columnType?: BooleanColumnType;
    isDeletedColumn?: boolean;
}
