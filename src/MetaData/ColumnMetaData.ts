import { ColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { IColumnOption } from "../Decorator/Option/IColumnOption";

export class ColumnMetaData<T = any> implements IColumnOption<T> {
    public name: string;
    public nullable: boolean;
    public default?: T;
    public description: string;
    public columnType: ColumnType;
    public type: GenericType<T>;
    public collation: string;
    public charset: string;
    // tslint:disable-next-line:no-shadowed-variable
    constructor(type?: GenericType<T>) {
        if (typeof type !== "undefined")
            this.type = type;
    }

    /**
     * Copy
     */
    public ApplyOption(columnMeta: IColumnOption<any>) {
        if (typeof columnMeta.name !== "undefined")
            this.name = columnMeta.name;
        if (columnMeta.description)
            this.description = columnMeta.description;
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
