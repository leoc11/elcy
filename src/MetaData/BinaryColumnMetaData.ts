import { BinaryColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";

export class BinaryColumnMetaData extends ColumnMetaData<Uint8Array> {
    public size?: number;
    public columnType: BinaryColumnType = "blob";
    constructor() {
        super(Uint8Array);
    }
}
