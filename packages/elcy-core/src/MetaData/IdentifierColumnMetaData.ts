import { GenericType } from "src/Common/Type";
import { IdentifierColumnType } from "../Common/ColumnType";
import { Uuid } from "../Data/Uuid";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class IdentifierColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, string | Uuid> {
    constructor(entity?: IEntityMetaData<TE>, type?: GenericType<string | Uuid>) {
        super(entity, type);
    }
    public override columnType: IdentifierColumnType = "uniqueidentifier";
}
