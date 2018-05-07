import { BooleanColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface";
// tslint:disable-next-line:ban-types
export class BooleanColumnMetaData<TE = any> extends ColumnMetaData<TE, boolean> {
    public columnType: BooleanColumnType = "boolean";
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Boolean, entityMeta);
    }
}
