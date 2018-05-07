import { DecimalColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface";
export class DecimalColumnMetaData<TE = any> extends ColumnMetaData<TE, number> {
    public precision?: number;
    public scale?: number;
    public columnType: DecimalColumnType = "decimal";
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Number, entityMeta);
    }
}
