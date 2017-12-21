import { ColumnMetaData } from "./ColumnMetaData";
import { IBooleanColumnMetaData } from "./Interface/IBooleanColumnMetaData";
// tslint:disable-next-line:ban-types
export class BooleanColumnMetaData extends ColumnMetaData<boolean> implements IBooleanColumnMetaData {
    public columnType: "boolean";
    constructor() {
        super(Boolean);
        this.columnType = "boolean";
    }
}
