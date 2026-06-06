import { IObjectType, PrimitiveType } from "src/Common/Type";
import { IdentifierColumnType } from "../Common/ColumnType";
import { Uuid } from "../Data/Uuid";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class IdentifierColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, string | Uuid> {
    constructor(entity?: IEntityMetaData<TE>, type?: PrimitiveType<string> | IObjectType<Uuid>);
    constructor(entity?: IEntityMetaData<TE>, type?: PrimitiveType<string> | IObjectType<Uuid>) {
        super(entity, type ?? Uuid);
    }
    public override columnType: IdentifierColumnType = "uniqueidentifier";
}
