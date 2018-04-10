import { StringColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IStringColumnOption } from "../Decorator/Option";
// tslint:disable-next-line:ban-types
export class StringColumnMetaData extends ColumnMetaData<string> {
    public maxLength?: number;
    public columnType: StringColumnType = "nvarchar";
    constructor() {
        super(String);
    }
    public applyOption(columnMeta: IStringColumnOption) {
        if (typeof columnMeta.maxLength !== "undefined")
            this.maxLength = columnMeta.maxLength;
        super.applyOption(columnMeta);
    }
}
