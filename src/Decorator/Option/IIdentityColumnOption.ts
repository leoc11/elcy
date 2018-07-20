import { IdentifierColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
import { UUID } from "../../Data/UUID";
// tslint:disable-next-line:ban-types
export interface IIdentityColumnOption extends IColumnOption<UUID> {
    columnType?: IdentifierColumnType;
}
