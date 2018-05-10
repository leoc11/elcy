import { GenericType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ColumnType } from "../../Common/ColumnType";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";

export class ColumnExpression<TE = any, T = any> implements IColumnExpression<TE, T> {
    public type: GenericType<T>;
    public propertyName: string;
    public columnType: ColumnType;
    public columnName: string;
    public columnMetaData: IColumnMetaData<TE, T>;
    public entity: IEntityExpression<TE>;
    public isPrimary: boolean;
    public isShadow?: boolean;
    constructor(entity: IEntityExpression<TE>, columnMeta: IColumnMetaData<TE, T>, isPrimary?: boolean);
    constructor(entity: IEntityExpression<TE>, type: GenericType<T>, propertyName: string, columnName: string, isPrimary?: boolean, columnType?: ColumnType);
    constructor(entity: IEntityExpression<TE>, columnMetaOrType: IColumnMetaData<TE, T> | GenericType<T>, isPrimaryOrPropertyName?: boolean | string, columnName?: string, isPrimary?: boolean, columnType?: ColumnType) {
        this.entity = entity;
        if ((columnMetaOrType as IColumnMetaData).entity) {
            this.columnMetaData = columnMetaOrType as IColumnMetaData<TE, T>;
            this.type = this.columnMetaData.type;
            this.propertyName = this.columnMetaData.propertyName;
            this.columnName = this.columnMetaData.columnName;
            this.isPrimary = isPrimaryOrPropertyName as boolean;
            this.columnType = this.columnMetaData.columnType;
        }
        else {
            this.type = columnMetaOrType as GenericType<T>;
            this.propertyName = isPrimaryOrPropertyName as string;
            this.columnName = columnName;
            this.isPrimary = isPrimary;
            this.columnType = columnType;
        }
    }
    public toString(queryBuilder: QueryBuilder): string {
        return queryBuilder.getExpressionString(this);
    }
    public execute(queryBuilder: QueryBuilder) {
        return this.toString(queryBuilder) as any;
    }
    public clone(entity?: IEntityExpression<TE>) {
        const clone = new ColumnExpression(entity || this.entity, this.type, this.propertyName, this.columnName, this.isPrimary, this.columnType);
        clone.columnMetaData = this.columnMetaData;
        return clone;
    }
}
