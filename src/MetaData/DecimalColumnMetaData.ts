import { DecimalColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
export class DecimalColumnMetaData extends ColumnMetaData<number> {
    public precision?: number;
    public scale?: number;
    public length?: number;
    public columnType: DecimalColumnType = "decimal";
    constructor() {
        super(Number);
    }
}
