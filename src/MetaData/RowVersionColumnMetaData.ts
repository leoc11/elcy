import { RowVersionColumnType } from "../Common/ColumnType";
import { ColumnGeneration } from "../Common/Enum";
import { ColumnMetaData } from "./ColumnMetaData";

export class RowVersionColumnMetaData<TE = any> extends ColumnMetaData<TE, Uint8Array> {
    constructor() {
        super(Uint8Array);
    }
    public columnType: RowVersionColumnType = "rowversion";
    public readonly generation = ColumnGeneration.Insert | ColumnGeneration.Update;
    public readonly isReadOnly = true;
}
