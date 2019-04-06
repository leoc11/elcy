import { RealColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
export class RealColumnMetaData<TE = any> extends ColumnMetaData<TE, number> {
    public size?: number;
    public columnType: RealColumnType = "real";
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Number, entityMeta);
    }
    public applyOption(columnMeta: RealColumnMetaData<TE>) {
        if (typeof columnMeta.size !== "undefined")
            this.size = columnMeta.size;
        super.applyOption(columnMeta);
    }
}
