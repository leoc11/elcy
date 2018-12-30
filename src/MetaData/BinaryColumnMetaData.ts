import { BinaryColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { GenericType } from "../Common/Type";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class BinaryColumnMetaData<TE> extends ColumnMetaData<TE, ArrayBufferView> {
    public size?: number;
    public columnType: BinaryColumnType = "blob";
    constructor(type: GenericType<ArrayBufferView>, entityMeta?: IEntityMetaData<TE>) {
        super(type, entityMeta);
    }

    public applyOption(columnMeta: BinaryColumnMetaData<TE>) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.type !== "undefined") this.type = columnMeta.type;
        if (typeof columnMeta.size !== "undefined") this.size = columnMeta.size;
    }
}
