import { IDecimalColumnMetaData } from "./Interface/IDecimalColumnMetaData";
import { NumericColumnMetaData } from "./NumericColumnMetaData";
export class DecimalColumnMetaData extends NumericColumnMetaData implements IDecimalColumnMetaData {
    public precision?: number;
    public scale?: number;
    public columnType: "decimal" | "float" | "double";
    constructor() {
        super();
    }
}
