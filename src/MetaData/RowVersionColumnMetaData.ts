import { RowVersionColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { ColumnGeneration } from "../Common/Type";

export class RowVersionColumnMetaData<TE = any> extends ColumnMetaData<TE, Uint8Array> {
    public columnType: RowVersionColumnType = "timestamp";
    constructor() {
        super(Uint8Array);
    }
    public readonly isReadOnly = true;
    public readonly generation = ColumnGeneration.Insert | ColumnGeneration.Update;
}
