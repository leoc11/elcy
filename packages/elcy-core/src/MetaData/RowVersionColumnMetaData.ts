import { GenericType } from "src/Common/Type";
import { RowVersionColumnType } from "../Common/ColumnType";
import { ColumnGeneration } from "../Common/Enum";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class RowVersionColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, Uint8Array> {
    constructor(entityMeta?: IEntityMetaData<TE>, type: GenericType<Uint8Array> = Uint8Array) {
        super(entityMeta, type);
    }
    public override columnType: RowVersionColumnType = "rowversion";
    public override readonly generation = ColumnGeneration.Insert | ColumnGeneration.Update;
    public override readonly isReadOnly = true;
}
