import { ColumnMetaData } from "./ColumnMetaData";
import { INumericColumnMetaData } from "./Interface/INumericColumnMetaData";
// tslint:disable-next-line:ban-types
export class NumericColumnMetaData extends ColumnMetaData<number> implements INumericColumnMetaData {
    public autoIncrement: boolean;
    public columnType: "decimal" | "bigint" | "int" | "tinyint" | "smallint" | "number" | "float" | "double";

    constructor() {
        super(Number);
    }
}
