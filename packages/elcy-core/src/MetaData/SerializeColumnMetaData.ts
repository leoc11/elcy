import { IObjectType } from "@elcy/enumerable";
import { SerializeColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class SerializeColumnMetaData<TE extends object = object, T = unknown> extends ColumnMetaData<TE, T> {
    constructor(entityMeta?: IEntityMetaData<TE>, type?: IObjectType<T>) {
        super(entityMeta, type);
    }
    public override columnType: SerializeColumnType = "json";
    public declare type: IObjectType<T>;
    public override applyOption(columnMeta: SerializeColumnMetaData<TE, T>) {
        super.applyOption(columnMeta);
        if (typeof columnMeta.type !== "undefined") {
            this.type = columnMeta.type;
        }
    }
}
