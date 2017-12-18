import "ColumnMetaKey";
import "reflect-metadata";
import "../../MetaData/ColumnMetaData/DateColumnMetaData";
import { columnMetaKey } from "./ColumnMetaKey";
import { DateColumnMetadata } from "../../MetaData/ColumnMetaData/index";

export function DateColumn(dateTimeKind: "UTC" | "Unspecified" | "custom", dbtype: "date" | "datetime", timezoneOffset = 0): {
    // tslint:disable-next-line:ban-types
    (target: Function): void;
    (target: object, propertyKey: string | symbol): void;
};
export function DateColumn(dateTimeKind: "UTC" | "Unspecified" | "custom", dbtype: "date" | "datetime", timezoneOffset: number): {
    // tslint:disable-next-line:ban-types
    (target: Function): void;
    (target: object, propertyKey: string | symbol): void;
} {
    const metadata = new DateColumnMetadata();
    metadata.dateTimeKind = dateTimeKind;
    metadata.dbtype = dbtype;
    metadata.timezoneOffset = timezoneOffset;
    return Reflect.metadata(columnMetaKey, metadata);
}

// specific type modifier
// DateTime: timezone
// Decimal: precision, scale
// nvarchar/string: maxlength
// int: incremental
// uuid: generated identity
// index
// unique
// timestamp | ModifiedDate
// CreatedDate
// DeleteProperty

// Closure Table
// TreeChildProperty
// TreeParentProperty
// TreeLevelProperty

// inheritance
// singletable | tableInheritance
// single 2 Entity with same tablename on entityMeta. => act much like embeded type.
// tableInheritane: 2 entity with different table but each one must specify it's primary key as relation could has different name but must have same type.

// relationship
// ForeignKey
// OneToOne  | ScalarNavigation | OneRelationship
// OneToMany | ListNavigation   | ManyRelationship
// ManyToOne | ScalarNavigation | OneRelationship

// Computed
// ComputedProperty. o => o.Orders.count() support custom relationship with select statement. o=>o.Orders.First(), o=>o.ORders.where();

// validation
// Nullable | MaxLength | Enum
// embedded type => split 1 table into 2/more entities
// json type => 1 column of table will be used as an object (JSON)
// 
