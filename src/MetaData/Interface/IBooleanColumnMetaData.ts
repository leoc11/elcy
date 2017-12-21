import { IColumnMetaData } from "./IColumnMetaData";
// tslint:disable-next-line:ban-types
export interface IBooleanColumnMetaData extends IColumnMetaData<boolean> {
    columnType?: "boolean";
}
