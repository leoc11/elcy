import { IdentifierColumnType } from "../../Common/ColumnType";
import { IColumnOption } from "./IColumnOption";
import { Uuid } from "../../Data/Uuid";
// tslint:disable-next-line:ban-types
export interface IIdentityColumnOption extends IColumnOption<Uuid> {
    columnType?: IdentifierColumnType;
}
