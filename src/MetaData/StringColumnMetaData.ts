import { StringColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";

export class StringColumnMetaData<TE = any> extends ColumnMetaData<TE, string> {
    public length?: number;
    public columnType: StringColumnType = "nvarchar";
    constructor() {
        super(String);
    }
    public applyOption(columnMeta: StringColumnMetaData<TE>) {
        if (typeof columnMeta.length !== "undefined") {
            this.length = columnMeta.length;
        }
        super.applyOption(columnMeta);
    }
}
