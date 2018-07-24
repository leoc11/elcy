import { RowVersionColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";

export class RowVersionColumnMetaData extends ColumnMetaData<Uint8Array> {
    public columnType: RowVersionColumnType = "timestamp";
    constructor() {
        super(Uint8Array);
    }
}
