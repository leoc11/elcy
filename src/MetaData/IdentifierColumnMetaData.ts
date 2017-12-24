import { IntColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
// tslint:disable-next-line:ban-types
export class IdentifierColumnMetaData extends ColumnMetaData<string> {
    public autoIncrement: boolean;
    public length?: number;
    public columnType: IntColumnType = "int";

    constructor() {
        super(String);
    }
}
