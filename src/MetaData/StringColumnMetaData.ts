import { StringColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
// tslint:disable-next-line:ban-types
export class StringColumnMetaData extends ColumnMetaData<string> {
    public maxLength?: number;
    public columnType: StringColumnType = "nvarchar";
    constructor() {
        super(String);
    }
}
