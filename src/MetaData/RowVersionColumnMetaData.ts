import { RowVersionColumnType } from "../Common/ColumnType";
import { ColumnGeneration } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";

export class RowVersionColumnMetaData<TE = any> extends ColumnMetaData<TE, Uint8Array> {
    public columnType: RowVersionColumnType = "rowversion";
    public readonly isReadOnly = true;
    public readonly generation = ColumnGeneration.Insert | ColumnGeneration.Update;
    constructor() {
        super(Uint8Array);
    }
}
