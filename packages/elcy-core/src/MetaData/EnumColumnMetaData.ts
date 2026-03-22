import { EnumColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

// TODO: for not supported db, use Check constraint
export class EnumColumnMetaData<TE extends object = object, T extends string | number = string | number> extends ColumnMetaData<TE, T> {
    constructor(entityMeta: IEntityMetaData<TE>, type?: GenericType<T>) {
        super(entityMeta, type ?? String as unknown as GenericType<T>);
    }
    public override columnType: EnumColumnType = "enum";
    public options: Array<string | number>;
    public override applyOption(columnMeta: EnumColumnMetaData<TE, T>) {
        if (typeof columnMeta.options !== "undefined") {
            this.options = columnMeta.options;
        }
        super.applyOption(columnMeta);
    }
}
