import { GenericType } from "src/Common/Type";
import { BigIntColumnType } from "../Common/ColumnType";
import { ColumnGeneration } from "../Common/Enum";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class BigIntColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, bigint> {
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<bigint>) {
        super(entityMeta, type ?? BigInt);
    }
    public autoIncrement: boolean;
    public override columnType: BigIntColumnType = "bigint";
    public size?: number;
    public override applyOption(columnMeta: BigIntColumnMetaData<TE>) {
        if (typeof columnMeta.autoIncrement !== "undefined") {
            this.autoIncrement = columnMeta.autoIncrement;
        }
        if (typeof columnMeta.size !== "undefined") {
            this.size = columnMeta.size;
        }
        super.applyOption(columnMeta);
        if (this.autoIncrement) {
            this.isReadOnly = true;
            this.generation = ColumnGeneration.Insert | ColumnGeneration.Update;
        }
    }
}
