import { BigIntColumnType } from "../Common/ColumnType";
import { ColumnGeneration } from "../Common/Enum";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class BigIntegerColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, BigInt> {
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(BigInt, entityMeta);
    }
    public autoIncrement: boolean;
    public columnType: BigIntColumnType = "bigint";
    public size?: number;
    public applyOption(columnMeta: BigIntegerColumnMetaData<TE>) {
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