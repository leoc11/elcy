import { ColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { IColumnOption } from "../Decorator/Option/IColumnOption";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";

export class ColumnMetaData<TE = any, T = any> implements IColumnMetaData<TE, T> {
    public entity: IEntityMetaData<TE>;
    public propertyName?: keyof TE;
    public columnName: string;
    public nullable: boolean;
    public default?: T;
    public description: string;
    public columnType: ColumnType;
    public type: GenericType<T>;
    public collation: string;
    public charset: string;
    constructor(type?: GenericType<T>, entityMeta?: IEntityMetaData<TE>) {
        if (typeof type !== "undefined")
            this.type = type;
        if (entityMeta)
            this.entity = entityMeta;
    }

    public applyOption(columnMeta: IColumnOption<any>) {
        if (typeof columnMeta.columnName !== "undefined")
            this.columnName = columnMeta.columnName;
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
