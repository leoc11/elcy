import { GenericType } from "src/Common/Type";
import { IntColumnType } from "../Common/ColumnType";
import { ColumnGeneration } from "../Common/Enum";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class IntegerColumnMetaData<TE extends object = any> extends ColumnMetaData<TE, number> {
    constructor(entityMeta?: IEntityMetaData<TE>, type: GenericType<number> = Number) {
        super(entityMeta, type);
    }
    public autoIncrement: boolean;
    public override columnType: IntColumnType = "int";
    public size?: number;
    public override applyOption(columnMeta: IntegerColumnMetaData<TE>) {
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
