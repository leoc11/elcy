import { IntColumnType } from "../Common/ColumnType";
import { ColumnMetaData } from "./ColumnMetaData";
import { INumericColumnOption } from "../Decorator/Option";
import { IEntityMetaData } from "./Interface";
// tslint:disable-next-line:ban-types
export class NumericColumnMetaData<TE = any> extends ColumnMetaData<TE, number> {
    public autoIncrement: boolean;
    public size?: number;
    public columnType: IntColumnType = "int";

    constructor(entityMeta?: IEntityMetaData<TE>) {
        super(Number, entityMeta);
    }
    public applyOption(columnMeta: INumericColumnOption) {
        if (typeof columnMeta.autoIncrement !== "undefined")
            this.autoIncrement = columnMeta.autoIncrement;
        if (typeof columnMeta.size !== "undefined")
            this.size = columnMeta.size;
        super.applyOption(columnMeta);
    }
}
