import { IntColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface";
export class NumericColumnMetaData<TE = any> extends ColumnMetaData<TE, number> {
    public autoIncrement: boolean;
    public length?: number;
    public columnType: IntColumnType = "int";

    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Number, entityMeta);
    }
    public applyOption(columnMeta: NumericColumnMetaData<TE>) {
        if (typeof columnMeta.autoIncrement !== "undefined")
            this.autoIncrement = columnMeta.autoIncrement;
        if (typeof columnMeta.length !== "undefined")
            this.length = columnMeta.length;
        super.applyOption(columnMeta);
    }
}
