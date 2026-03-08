import { SerializeColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class SerializeColumnMetaData<TE extends object = object, T = unknown> extends ColumnMetaData<TE, T> {
    constructor(type: GenericType<T>, entityMeta?: IEntityMetaData<TE>) {
        super(type, entityMeta);
    }
    public columnType: SerializeColumnType = "json";
    public type: GenericType<T>;
    public applyOption(columnMeta: SerializeColumnMetaData<TE, T>) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.type !== "undefined") {
            this.type = columnMeta.type;
        }
    }
}
