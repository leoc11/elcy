import { RealColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
export class RealColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, number> {
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(entityMeta, Number);
    }
    public override columnType: RealColumnType = "real";
    public size?: number;
    public override applyOption(columnMeta: RealColumnMetaData<TE>) {
        if (typeof columnMeta.size !== "undefined") {
            this.size = columnMeta.size;
        }
        super.applyOption(columnMeta);
    }
}
