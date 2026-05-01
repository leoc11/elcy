import type Decimal from "decimal.js";
import { DecimalColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { GenericType } from "src/Common/Type";
export class DecimalColumnMetaData<TE extends object = object> extends ColumnMetaData<TE, string | number | Decimal> {
    constructor(entityMeta?: IEntityMetaData<TE>, type?: GenericType<string | number | Decimal>) {
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
