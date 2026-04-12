import { GenericType } from "src/Common/Type";
import { RowVersionColumnType } from "../Common/ColumnType";
import { ColumnGeneration } from "../Common/Enum";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class RowVersionColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, bigint> {
    constructor(entityMeta?: IEntityMetaData<TE>, type: GenericType<bigint> = BigInt) {
        super(entityMeta, type);
    }
    public override columnType: RowVersionColumnType = "bigint";
    public override readonly generation = ColumnGeneration.Insert | ColumnGeneration.Update;
    public override readonly isReadOnly = true;
}
