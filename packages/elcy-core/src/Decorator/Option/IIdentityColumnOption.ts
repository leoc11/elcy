import { IdentifierColumnType } from "../../Common/ColumnType";
import { Uuid } from "../../Data/Uuid";
import { IColumnOption } from "./IColumnOption";
// tslint:disable-next-line:ban-types
export interface IIdentityColumnOption extends IColumnOption<string | Uuid> {
    columnType?: IdentifierColumnType;
}
