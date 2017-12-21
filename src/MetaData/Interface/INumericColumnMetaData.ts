import { IColumnMetaData } from "./IColumnMetaData";
// tslint:disable-next-line:ban-types
export interface INumericColumnMetaData extends IColumnMetaData<number> {
    autoIncrement?: boolean;
    columnType?: "decimal" | "bigint" | "int" | "tinyint" | "smallint" | "number" | "float" | "double";
}
