import { StringColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";

export class StringColumnMetaData extends ColumnMetaData<string> {
    public maxLength?: number;
    public columnType: StringColumnType = "nvarchar";
    constructor() {
        super(String);
    }
    public applyOption(columnMeta: StringColumnMetaData) {
        if (typeof columnMeta.maxLength !== "undefined")
            this.maxLength = columnMeta.maxLength;
        super.applyOption(columnMeta);
    }
}
