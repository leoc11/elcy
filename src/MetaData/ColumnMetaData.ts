import { ColumnType } from "../Common/ColumnType";
import { GenericType } from "../Common/Type";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { FunctionExpression } from "../ExpressionBuilder/Expression/FunctionExpression";
import { ExpressionBuilder } from "../ExpressionBuilder/ExpressionBuilder";

export class ColumnMetaData<TE = any, T = any> implements IColumnMetaData<TE, T> {
    public entity: IEntityMetaData<TE>;
    public propertyName?: keyof TE;
    public columnName: string;
    public nullable = true;
    public default?: FunctionExpression<any, T>;
    public description: string;
    public columnType: ColumnType;
    public type: GenericType<T>;
    public collation: string;
    public charset: string;
    public get isPrimaryColumn(): boolean {
        return this.entity.primaryKeys.contains(this);
    }
    constructor(type?: GenericType<T>, entityMeta?: IEntityMetaData<TE>) {
        if (typeof type !== "undefined")
            this.type = type;
        if (entityMeta)
            this.entity = entityMeta;
    }
    public applyOption(columnMeta: IColumnMetaData<TE, T>) {
        if (!this.type && typeof columnMeta.type !== "undefined")
            this.type = columnMeta.type;
        if (typeof columnMeta.propertyName !== "undefined")
            this.propertyName = columnMeta.propertyName;
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
        if (typeof columnMeta.default !== "undefined") {
            if (columnMeta.default instanceof FunctionExpression) {
                if (columnMeta.default.type === this.type)
                    this.default = columnMeta.default;
            }
            // NOTE: Column decorator default support Function declaration
            else if (columnMeta.default as any instanceof Function) {
                this.default = ExpressionBuilder.parse(columnMeta.default as any);
            }
        }
    }
}
