import { ColumnMetaData } from "./ColumnMetaData";
// tslint:disable-next-line:ban-types
export class StringColumnMetaData extends ColumnMetaData<String> {
    public maxLength?: number;
    public dbtype: "nvarchar" | "varchar";
    constructor() {
        super(String);
    }
}
