import { ApproximateNumberColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
export class ApproximateNumberColumnMetaData<TE = any> extends ColumnMetaData<TE, number> {
    public precision?: number;
    public scale?: number;
    public columnType: ApproximateNumberColumnType = "real";
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Number, entityMeta);
    }
    public applyOption(columnMeta: ApproximateNumberColumnMetaData<TE>) {
        if (typeof columnMeta.precision !== "undefined")
            this.precision = columnMeta.precision;
        if (typeof columnMeta.scale !== "undefined")
            this.scale = columnMeta.scale;
        super.applyOption(columnMeta);
    }
}
