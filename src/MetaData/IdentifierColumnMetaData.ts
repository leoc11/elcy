import { IdentifierColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { UUID } from "../Data/UUID";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class IdentifierColumnMetaData<TE> extends ColumnMetaData<TE, UUID> {
    public columnType: IdentifierColumnType = "uniqueidentifier";
    constructor(entity?: IEntityMetaData<TE>) {
        super(UUID, entity);
    }
}
