import { IdentifierColumnType } from "../Common/ColumnType";
import { Uuid } from "../Data/Uuid";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class IdentifierColumnMetaData<TE> extends ColumnMetaData<TE, Uuid> {
    public columnType: IdentifierColumnType = "uniqueidentifier";
    constructor(entity?: IEntityMetaData<TE>) {
        super(Uuid, entity);
    }
}
