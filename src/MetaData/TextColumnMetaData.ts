import { TextColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
// tslint:disable-next-line:ban-types
export class TextColumnMetaData extends ColumnMetaData<string> {
    public columnType: TextColumnType = "nvarchar";
    constructor() {
        super(String);
    }
}
