import { DecimalColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { DecimalValueType, GenericType } from "src/Common/Type";
export class DecimalColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, DecimalValueType> {
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<DecimalValueType>) {
        super(entityMeta, type ?? String);
    }
    public override columnType: DecimalColumnType = "decimal";
    public precision?: number;
    public scale?: number;

    public override applyOption(columnMeta: DecimalColumnMetaData<TE>) {
        if (typeof columnMeta.scale !== "undefined") {
            this.scale = columnMeta.scale;
        }
        if (typeof columnMeta.precision !== "undefined") {
            this.precision = columnMeta.precision;
        }
        super.applyOption(columnMeta);
    }
}
