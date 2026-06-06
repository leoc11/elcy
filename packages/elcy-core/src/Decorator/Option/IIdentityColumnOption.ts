import { IdentifierColumnType } from "../../Common/ColumnType";
import { Uuid } from "../../Data/Uuid";
import { IColumnOption } from "./IColumnOption";
// tslint:disable-next-line:ban-types
export interface IIdentityColumnOption<T extends string | Uuid> extends IColumnOption<T> {
    columnType?: IdentifierColumnType;
}
