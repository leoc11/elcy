import { EnumColumnType } from "../Common/ColumnType";
import { genericType, IEnumType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";

// TODO: for not supported db, use Check constraint
export class EnumColumnMetaData<T extends string | number> extends ColumnMetaData<T> {
    public columnType: EnumColumnType = "enum";
    constructor(public type: genericType<T>, public options: T[]) {
        super(type);
    }
}
