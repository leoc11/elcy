import { BinaryColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class BinaryColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, ArrayBufferView> {
    constructor(entityMeta: IEntityMetaData<TE>, type?: GenericType<ArrayBufferView>) {
        super(entityMeta, type ?? Uint8Array);
    }
    public columnType: BinaryColumnType = "binary";
    public size?: number;

    public applyOption(columnMeta: BinaryColumnMetaData<TE>) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.type !== "undefined") {
            this.type = columnMeta.type;
        }
        if (typeof columnMeta.size !== "undefined") {
            this.size = columnMeta.size;
        }
    }
}
