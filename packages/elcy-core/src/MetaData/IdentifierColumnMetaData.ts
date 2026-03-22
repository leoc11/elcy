import { GenericType } from "src/Common/Type";
import { IdentifierColumnType } from "../Common/ColumnType";
import { Uuid } from "../Data/Uuid";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class IdentifierColumnMetaData<TE extends object = object, T extends string | Uuid = string | Uuid> extends ColumnMetaData<TE, T> {
    constructor(entity?: IEntityMetaData<TE>, type?: GenericType<T>) {
        super(entity, type);
    }
    public override columnType: IdentifierColumnType = "uniqueidentifier";
}
