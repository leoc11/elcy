import { StringColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class StringColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, string> {
    constructor(entityMeta: IEntityMetaData<TE>) {
        super(entityMeta, String);
    }
    public override columnType: StringColumnType = "nvarchar";
    public length?: number;
    public override applyOption(columnMeta: StringColumnMetaData<TE>) {
        if (typeof columnMeta.length !== "undefined") {
            this.length = columnMeta.length;
        }
        super.applyOption(columnMeta);
    }
}
