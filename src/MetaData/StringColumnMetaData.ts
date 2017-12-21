import { ColumnMetaData } from "./ColumnMetaData";
import { IStringColumnMetaData } from "./Interface/IStringColumnMetaData";
// tslint:disable-next-line:ban-types
export class StringColumnMetaData extends ColumnMetaData<string> implements IStringColumnMetaData {
    public maxLength?: number;
    public columnType: "nvarchar" | "varchar";
    constructor() {
        super(String);
    }
}
