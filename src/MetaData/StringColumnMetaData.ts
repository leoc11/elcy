import { StringColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IStringColumnOption } from "../Decorator/Option";

export class StringColumnMetaData extends ColumnMetaData<string> {
    public size?: number;
    public columnType: StringColumnType = "nvarchar";
    constructor() {
        super(String);
    }
    public applyOption(columnMeta: IStringColumnOption) {
        if (typeof columnMeta.maxLength !== "undefined")
            this.size = columnMeta.maxLength;
        super.applyOption(columnMeta);
    }
}
