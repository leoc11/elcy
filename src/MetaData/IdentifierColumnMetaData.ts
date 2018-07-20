import { IdentifierColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { UUID } from "../Data/UUID";

export class IdentifierColumnMetaData extends ColumnMetaData<UUID> {
    public columnType: IdentifierColumnType = "uniqueidentifier";
    constructor() {
        super(UUID);
    }
}
