import { IdentifierColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";

export class IdentifierColumnMetaData extends ColumnMetaData<string> {
    public columnType: IdentifierColumnType = "uniqueidentifier";
    constructor() {
        super(String);
    }
}
