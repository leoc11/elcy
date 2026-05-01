import { GenericType } from "src/Common/Type";
import { RowVersionColumnType } from "../Common/ColumnType";
import { ColumnGeneration } from "../Common/Enum";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class RowVersionColumnMetaData<TE extends object = object, T extends number | Uint8Array = number | Uint8Array> extends ColumnMetaData<TE, T> {
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<T>) {
        super(entityMeta, type ?? Number as unknown as GenericType<T>);
    }
    public override columnType: RowVersionColumnType = "int";
    public override readonly generation = ColumnGeneration.Insert | ColumnGeneration.Update;
    public override readonly isReadOnly = true;
}
