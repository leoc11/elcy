import { BooleanColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
// tslint:disable-next-line:ban-types
export class BooleanColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, boolean> {
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(entityMeta, Boolean);
    }
    public columnType: BooleanColumnType = "boolean";
}
