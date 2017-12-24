import { EnumColumnType } from "../../Common/ColumnType";
import { IEnumType, IObjectType } from "../../Common/Type";
import { IColumnOption } from "./IColumnOption";
// tslint:disable-next-line:ban-types
export interface IEnumColumnOption<T extends string | number> extends IColumnOption<T> {
    type?: IObjectType<T>;
    options?: IEnumType<T> | T[];
    columnType?: EnumColumnType;
}
