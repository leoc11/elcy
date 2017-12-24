import { BooleanColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
// tslint:disable-next-line:ban-types
export class BooleanColumnMetaData extends ColumnMetaData<boolean> {
    public columnType: BooleanColumnType = "boolean";
    constructor() {
        super(Boolean);
    }
}
