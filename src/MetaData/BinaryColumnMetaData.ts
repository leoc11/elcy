import { BinaryColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class BinaryColumnMetaData<TE extends object = object, T extends ArrayBufferView = ArrayBufferView> extends ColumnMetaData<TE, T> {
    constructor(type: GenericType<T>, entityMeta?: IEntityMetaData<TE>) {
        super(type, entityMeta);
    }
    public columnType: BinaryColumnType = "binary";
    public size?: number;

    public applyOption(columnMeta: BinaryColumnMetaData<TE, T>) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.type !== "undefined") {
            this.type = columnMeta.type;
        }
        if (typeof columnMeta.size !== "undefined") {
            this.size = columnMeta.size;
        }
    }
}
