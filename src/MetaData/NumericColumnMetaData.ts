import { ColumnMetaData } from "./ColumnMetaData";
// tslint:disable-next-line:ban-types
export class NumericColumnMetaData extends ColumnMetaData<Number> {
    public autoIncrement: boolean;
    public dbtype: "decimal" | "bigint" | "int" | "tinyint" | "smallint" | "number" | "float" | "double";

    constructor() {
        super(Number);
    }
}
