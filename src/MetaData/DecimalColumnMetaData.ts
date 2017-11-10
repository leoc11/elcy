import { NumericColumnMetaData } from "./NumericColumnMetaData";
export class DecimalColumnMetaData extends NumericColumnMetaData {
    public precision?: number;
    public scale?: number;
    public dbtype: "decimal";
    constructor() {
        super();
    }
}
