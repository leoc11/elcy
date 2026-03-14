import { EnumColumnType } from "../../Common/ColumnType";
import { IEnumType } from "../../Common/Type";
import { IColumnOption } from "./IColumnOption";
// tslint:disable-next-line:ban-types
export interface IEnumColumnOption extends IColumnOption<string | number> {
    columnType?: EnumColumnType;
    options?: IEnumType<string | number> | Array<string | number>;
}
