import { IColumnMetaData } from "./IColumnMetaData";
// tslint:disable-next-line:ban-types
export interface IStringColumnMetaData extends IColumnMetaData<string> {
    maxLength?: number;
    columnType?: "nvarchar" | "varchar" | "char" | "nchar";
}
