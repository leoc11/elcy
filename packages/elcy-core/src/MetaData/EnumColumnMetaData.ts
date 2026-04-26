import { EnumColumnType } from "../Common/ColumnType";
import { GenericType, IEnumType, PrimitiveType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

// TODO: for not supported db, use Check constraint
export class EnumColumnMetaData<TE extends object = object, T extends string | number = string | number> extends ColumnMetaData<TE, T> {
    constructor(entityMeta: IEntityMetaData<TE>, options: IEnumType<T>, type?: PrimitiveType<T>);
    constructor(entityMeta: IEntityMetaData<TE>, options: IEnumType<T>, type?: GenericType<T>);
    constructor(entityMeta: IEntityMetaData<TE>, options: IEnumType<T>, type?: GenericType<T>) {
        if (!type) {
            type = Object.values(options)[0].constructor as GenericType<T>;
        }
        super(entityMeta, type);
        this.options = options;
    }
    public override columnType: EnumColumnType = "enum";
    public options: IEnumType<T>;
    public override applyOption(columnMeta: EnumColumnMetaData<TE, T>) {
        if (typeof columnMeta.options !== "undefined") {
            this.options = columnMeta.options;
        }
        super.applyOption(columnMeta);
    }
}
