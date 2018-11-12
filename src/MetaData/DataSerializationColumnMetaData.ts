import { DataSerializationColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

// TODO: parser for xml
export class DataSerializationColumnMetaData<TE, T> extends ColumnMetaData<TE, T> {
    public columnType: DataSerializationColumnType = "json";
    public type: GenericType<T>;
    constructor(type: GenericType<T>, entityMeta?: IEntityMetaData<TE>) {
        super(type, entityMeta);
    }
    public serialize(data: string): T {
        return JSON.parse(data);
    }
    public deserialize(data: T): string {
        return JSON.stringify(data);
    }
    public applyOption(columnMeta: DataSerializationColumnMetaData<TE, T>) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.type !== "undefined") this.type = columnMeta.type;
    }
}
