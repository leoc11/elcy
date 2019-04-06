import { GenericType } from "../../Common/Type";
import { IColumnExpression } from "./IColumnExpression";
import { IEntityExpression } from "./IEntityExpression";
import { ColumnType } from "../../Common/ColumnType";
import { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import { hashCode, resolveClone } from "../../Helper/Util";
import { IExpression } from "../../ExpressionBuilder/Expression/IExpression";

export class ColumnExpression<TE = any, T = any> implements IColumnExpression<TE, T> {
    public type: GenericType<T>;
    public propertyName: keyof TE;
    public columnName: string;
    public alias?: string;
    public get dataPropertyName() {
        return this.alias || this.columnName;
    }
    public columnMeta: IColumnMetaData<TE, T>;
    public entity: IEntityExpression<TE>;
    public isPrimary: boolean;
    public isNullable: boolean;
    constructor(entity: IEntityExpression<TE>, columnMeta: IColumnMetaData<TE, T>, isPrimary?: boolean);
    constructor(entity: IEntityExpression<TE>, type: GenericType<T>, propertyName: keyof TE, columnName: string, isPrimary?: boolean, isNullable?: boolean, columnType?: ColumnType);
    constructor(entity: IEntityExpression<TE>, columnMetaOrType: IColumnMetaData<TE, T> | GenericType<T>, isPrimaryOrPropertyName?: boolean | keyof TE, columnName?: string, isPrimary?: boolean, isNullable?: boolean, columnType?: ColumnType) {
        this.entity = entity;
        if ((columnMetaOrType as IColumnMetaData).entity) {
            this.columnMeta = columnMetaOrType as IColumnMetaData<TE, T>;
            this.type = this.columnMeta.type;
            this.propertyName = this.columnMeta.propertyName;
            this.columnName = this.columnMeta.columnName;
            this.isPrimary = isPrimaryOrPropertyName as boolean;
            this.isNullable = this.columnMeta.nullable;
        }
        else {
            this.type = columnMetaOrType as GenericType<T>;
            this.propertyName = isPrimaryOrPropertyName as keyof TE;
            this.columnName = columnName;
            this.isPrimary = isPrimary;
            this.isNullable = isNullable;
        }
    }
    public toString(): string {
        return `Column(${this.propertyName})`;
    }
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) replaceMap = new Map();
        const entity = resolveClone(this.entity, replaceMap);
        const clone = new ColumnExpression(entity, this.type, this.propertyName, this.columnName, this.isPrimary, this.isNullable);
        clone.columnMeta = this.columnMeta;
        clone.alias = this.alias;
        clone.isNullable = this.isNullable;
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode(this.propertyName, hashCode(this.columnName, this.entity.hashCode()));
    }
}
