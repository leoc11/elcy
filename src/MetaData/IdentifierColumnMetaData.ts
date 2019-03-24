import { IdentifierColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { Uuid } from "../Data/Uuid";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class IdentifierColumnMetaData<TE> extends ColumnMetaData<TE, Uuid> {
    public columnType: IdentifierColumnType = "uniqueidentifier";
    constructor(entity?: IEntityMetaData<TE>) {
        super(Uuid, entity);
    }
}
