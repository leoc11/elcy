import type { ColumnType } from "../../Common/ColumnType";
import type { GenericType, PrimitiveType, StringKeyOf, ValueType } from "../../Common/Type";
import type { IExpression } from "../../ExpressionBuilder/Expression/IExpression";
import type { IColumnMetaData } from "../../MetaData/Interface/IColumnMetaData";
import type { IColumnExpression } from "./IColumnExpression";
import type { IEntityExpression } from "./IEntityExpression";
import { resolveClone } from "../../Helper/Expression";
import { hashCode } from "../../Helper/Hash";

export class ColumnExpression<TE extends object = any, T = ValueType> implements IColumnExpression<TE, T> {
    public get dataPropertyName() {
        return this.alias || this.columnName;
    }
    constructor(entity: IEntityExpression<TE>, columnMeta: IColumnMetaData<TE, T>, isPrimary?: boolean);
    constructor(entity: IEntityExpression<TE>, type: PrimitiveType<T>, propertyName: StringKeyOf<TE>, columnName: string, isPrimary?: boolean, isNullable?: boolean, columnType?: ColumnType);
    constructor(entity: IEntityExpression<TE>, type: GenericType<T>, propertyName: StringKeyOf<TE>, columnName: string, isPrimary?: boolean, isNullable?: boolean, columnType?: ColumnType);
    constructor(entity: IEntityExpression<TE>, columnMetaOrType: IColumnMetaData<TE, T> | GenericType<T>, isPrimaryOrPropertyName?: boolean | StringKeyOf<TE>, columnName?: string, isPrimary?: boolean, isNullable?: boolean, columnType?: ColumnType) {
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
            this.propertyName = isPrimaryOrPropertyName as StringKeyOf<TE>;
            this.columnName = columnName;
            this.isPrimary = isPrimary;
            this.isNullable = isNullable;
        }
    }
    public alias?: string;
    public columnMeta: IColumnMetaData<TE, T>;
    public columnName: string;
    public entity: IEntityExpression<TE>;
    public isNullable: boolean;
    public isPrimary: boolean;
    public propertyName: StringKeyOf<TE>;
    public type: GenericType<T>;
    public clone(replaceMap?: Map<IExpression, IExpression>) {
        if (!replaceMap) {
            replaceMap = new Map();
        }
        const entity = resolveClone(this.entity, replaceMap);
        const clone = new ColumnExpression(entity, this.type, this.propertyName, this.columnName, this.isPrimary, this.isNullable);
        clone.columnMeta = this.columnMeta;
        clone.alias = this.alias;
        clone.isNullable = this.isNullable;
        replaceMap.set(this, clone);
        return clone;
    }
    public hashCode() {
        return hashCode(this.propertyName, hashCode(this.columnName, hashCode(this.entity.name)));
    }
    public toString(): string {
        return `Column(${this.propertyName})`;
    }
}
