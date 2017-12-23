import { ColumnType } from "../Driver/Types/ColumnType";
import { IColumnMetaData } from "./Interface";
import { genericType } from "./Types";
// tslint:disable-next-line:max-classes-per-file
export class ColumnMetaData<T> implements IColumnMetaData<T> {
    public name: string;
    public indexed: boolean;
    public nullable: boolean;
    public default?: T;
    public description: string;
    public columnType: ColumnType;
    public type: genericType<T>;
    public collation: string;
    public charset: string;
    // tslint:disable-next-line:no-shadowed-variable
    constructor(type?: genericType<T>) {
        if (typeof type !== "undefined")
            this.type = type;
    }

    /**
     * Copy
     */
    public Copy(columnMeta: IColumnMetaData<any>) {
        if (typeof columnMeta.name !== "undefined")
            this.name = columnMeta.name;
        if (columnMeta.description)
            this.description = columnMeta.description;
        if (typeof columnMeta.indexed !== "undefined")
            this.indexed = columnMeta.indexed;
        if (typeof columnMeta.nullable !== "undefined")
            this.nullable = columnMeta.nullable;
        if (typeof columnMeta.columnType !== "undefined")
            this.columnType = columnMeta.columnType;
        if (typeof columnMeta.collation !== "undefined")
            this.collation = columnMeta.collation;
        if (typeof columnMeta.charset !== "undefined")
            this.charset = columnMeta.charset;
        if (typeof columnMeta.default !== "undefined" && columnMeta.default !== null && columnMeta.default.constructor === this.type)
            this.default = columnMeta.default;
    }
}
