import { DecimalColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
export class DecimalColumnMetaData<TE = any> extends ColumnMetaData<TE, number> {
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Number, entityMeta);
    }
    public columnType: DecimalColumnType = "decimal";
    public precision?: number;
    public scale?: number;

    public applyOption(columnMeta: DecimalColumnMetaData<TE>) {
        if (typeof columnMeta.scale !== "undefined") {
            this.scale = columnMeta.scale;
        }
        if (typeof columnMeta.precision !== "undefined") {
            this.precision = columnMeta.precision;
        }
        super.applyOption(columnMeta);
    }
}
