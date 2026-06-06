import { DateValueType, GenericType } from "src/Common/Type";
import { DateColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
export class DateColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, DateValueType> {
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<DateValueType>) {
        super(entityMeta, type ?? Date);
    }
    public override columnType: DateColumnType = "date";
}
