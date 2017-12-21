import { INumericColumnMetaData } from "./INumericColumnMetaData";
// tslint:disable-next-line:ban-types
export interface IDecimalColumnMetaData extends INumericColumnMetaData {
    precision?: number;
    scale?: number;
    columnType?: "decimal" | "float" | "double";
}
