import { BooleanColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
// tslint:disable-next-line:ban-types
export class BooleanColumnMetaData<TE = any> extends ColumnMetaData<TE, boolean> {
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Boolean, entityMeta);
    }
    public columnType: BooleanColumnType = "boolean";
    public isDeleteColumn?: boolean;

    public applyOption(columnMeta: BooleanColumnMetaData<TE>) {
        if (typeof columnMeta.isDeleteColumn !== "undefined") {
            this.isDeleteColumn = columnMeta.isDeleteColumn;
        }
        super.applyOption(columnMeta);
        if (this.isDeleteColumn) {
            this.isReadOnly = true;
        }
    }
}
