import { StringColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";

export class StringColumnMetaData<TE = any> extends ColumnMetaData<TE, string> {
    constructor() {
        super(String);
    }
    public columnType: StringColumnType = "nvarchar";
    public length?: number;
    public applyOption(columnMeta: StringColumnMetaData<TE>) {
        if (typeof columnMeta.length !== "undefined") {
            this.length = columnMeta.length;
        }
        super.applyOption(columnMeta);
    }
}
