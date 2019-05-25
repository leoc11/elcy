import { SerializeColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class SerializeColumnMetaData<TE, T> extends ColumnMetaData<TE, T> {
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
    public deserialize(data: T): string {
        return JSON.stringify(data);
    }
    public serialize(data: string): T {
        return JSON.parse(data);
    }
}
