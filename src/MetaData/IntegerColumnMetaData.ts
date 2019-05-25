import { IntColumnType } from "../Common/ColumnType";
import { ColumnGeneration } from "../Common/Type";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
export class IntegerColumnMetaData<TE = any> extends ColumnMetaData<TE, number> {
    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Number, entityMeta);
    }
    public autoIncrement: boolean;
    public columnType: IntColumnType = "int";
    public size?: number;
    public applyOption(columnMeta: IntegerColumnMetaData<TE>) {
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
