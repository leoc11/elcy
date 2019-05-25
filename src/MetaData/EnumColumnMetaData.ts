import { EnumColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

// TODO: for not supported db, use Check constraint
export class EnumColumnMetaData<TE = any, T extends string | number = any> extends ColumnMetaData<TE, T> {
    constructor(type?: GenericType<T>, entityMeta?: IEntityMetaData<TE>) {
        super(type, entityMeta);
    }
    public columnType: EnumColumnType = "enum";
    public options: T[];
    public type: GenericType<T>;
    public applyOption(columnMeta: EnumColumnMetaData<TE>) {
        if (typeof columnMeta.options !== "undefined") {
            this.options = columnMeta.options;
        }
        super.applyOption(columnMeta);
    }
}
