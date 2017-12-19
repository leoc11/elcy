import "ColumnMetaKey";
import "reflect-metadata";
import "../../MetaData/ColumnMetaData/DateColumnMetaData";
import { DateColumnMetadata } from "../MetaData/ColumnMetaData/index";
import { columnMetaKey } from "./DecoratorKey";

export function DateColumn(dateTimeKind: number): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
export function DateColumn(name: string, dbtype: "date" | "datetime" = "datetime", dateTimeKind: "UTC" | "Unspecified" | "Custom" = "UTC", timezoneOffset = 0): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    const metadata = new DateColumnMetadata();
    if (typeof (dateTimeKind) === "number") {
        timezoneOffset = dateTimeKind;
        metadata.dateTimeKind = "Custom";
        metadata.dbtype = dbtype;
        metadata.timezoneOffset = timezoneOffset;
        metadata.name = name;
    }
    else {
        metadata.dateTimeKind = dateTimeKind;
        metadata.dbtype = dbtype;
        metadata.timezoneOffset = timezoneOffset;
        metadata.name = name;
    }
    return (target: object, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
        if (!metadata.name) {
            if (typeof (propertyKey) === "string")
                metadata.name = propertyKey;
        }
        let existingRequiredParameters: number[] = Reflect.getOwnMetadata(columnMetaKey, target, propertyKey);
        existingRequiredParameters.push(parameterIndex);
        Reflect.defineMetadata(requiredMetadataKey, existingRequiredParameters, target, propertyKey);
    }
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
