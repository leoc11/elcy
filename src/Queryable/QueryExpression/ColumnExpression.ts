import { GenericType } from "../../Common/Type";
import { QueryBuilder } from "../../QueryBuilder/QueryBuilder";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ColumnType } from "../../Common/ColumnType";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { hashCode, resolveClone } from "../../Helper/Util";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

export class ColumnExpression<TE = any, T = any> implements IColumnExpression<TE, T> {
    public type: GenericType<T>;
    public propertyName: keyof TE;
    public columnType: ColumnType;
    public columnName: string;
    public alias?: string;
    public columnMetaData: IColumnMetaData<TE, T>;
    public entity: IEntityExpression<TE>;
    public isPrimary: boolean;
    public isShadow?: boolean;
    constructor(entity: IEntityExpression<TE>, columnMeta: IColumnMetaData<TE, T>, isPrimary?: boolean);
    constructor(entity: IEntityExpression<TE>, type: GenericType<T>, propertyName: keyof TE, columnName: string, isPrimary?: boolean, columnType?: ColumnType);
    constructor(entity: IEntityExpression<TE>, columnMetaOrType: IColumnMetaData<TE, T> | GenericType<T>, isPrimaryOrPropertyName?: boolean | keyof TE, columnName?: string, isPrimary?: boolean, columnType?: ColumnType) {
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
            this.propertyName = isPrimaryOrPropertyName as keyof TE;
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
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const entity = resolveClone(this.entity, replaceMap);
        const clone = new ColumnExpression(entity, this.type, this.propertyName, this.columnName, this.isPrimary, this.columnType);
        clone.columnMetaData = this.columnMetaData;
        clone.alias = this.alias;
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode(this.propertyName, hashCode(this.columnName, this.entity.hashCode()));
    }
}
