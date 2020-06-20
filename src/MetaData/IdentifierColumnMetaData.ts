import { IdentifierColumnType } from "../Common/ColumnType";
import { Uuid } from "../Common/Uuid";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class IdentifierColumnMetaData<TE> extends ColumnMetaData<TE, Uuid> {
    constructor(entity?: IEntityMetaData<TE>) {
        super(Uuid, entity);
    }
    public columnType: IdentifierColumnType = "uniqueidentifier";
}
