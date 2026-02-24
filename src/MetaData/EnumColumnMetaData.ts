import { EnumColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

// TODO: for not supported db, use Check constraint
export class EnumColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, string | number> {
    constructor(entityMeta: IEntityMetaData<TE>, type?: GenericType<string | number>) {
        super(entityMeta, type ?? String);
    }
    public columnType: EnumColumnType = "enum";
    public options: Array<string | number>;
    public type: GenericType<string | number>;
    public applyOption(columnMeta: EnumColumnMetaData<TE>) {
        if (typeof columnMeta.options !== "undefined") {
            this.options = columnMeta.options;
        }
        super.applyOption(columnMeta);
    }
}
