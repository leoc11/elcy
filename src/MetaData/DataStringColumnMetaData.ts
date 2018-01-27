import { DataStringColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";

// TODO: parser for xml
export class DataStringColumnMetaData<T> extends ColumnMetaData<T> {
    public columnType: DataStringColumnType = "json";
    constructor(type: GenericType<T>) {
        super(type);
    }
}
