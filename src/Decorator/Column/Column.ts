import "reflect-metadata";
import { AbstractEntityMetaData, BooleanColumnMetaData, ColumnMetaData, DateColumnMetaData } from "../../MetaData";
import { IEntityMetaData } from "../../MetaData/Interface";
import { InheritedColumnMetaData } from "../../MetaData/Relation";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";
import { AbstractEntity } from "../Entity";
import { IColumnOption } from "../Option";

export function Column<T>(metadata: ColumnMetaData<T>, columnOption?: IColumnOption): PropertyDecorator {
    return (target: object, propertyKey: string /* | symbol*//*, descriptor: PropertyDescriptor*/) => {
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (!entityMetaData) {
            AbstractEntity()(target.constructor as ObjectConstructor);
            entityMetaData = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        }
        if (!metadata.name) {
            if (typeof (propertyKey) === "string")
                metadata.name = propertyKey;
        }

        const columnMetaData: ColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, target, propertyKey);
        if (columnMetaData != null) {
            metadata.ApplyOption(columnMetaData);
        }
        Reflect.defineMetadata(columnMetaKey, metadata, target, propertyKey);

        if (!entityMetaData.properties.contain(propertyKey))
            entityMetaData.properties.push(propertyKey);
        if (columnOption) {
            if (metadata instanceof DateColumnMetaData) {
                if (columnOption.isCreatedDate)
                    entityMetaData.createDateProperty = propertyKey;
                else if (columnOption.isModifiedDate)
                    entityMetaData.modifiedDateProperty = propertyKey;
            }
            else if (metadata instanceof BooleanColumnMetaData) {
                if (columnOption.isDeleteColumn)
                    entityMetaData.deleteProperty = propertyKey;
            }
        }

        if (entityMetaData instanceof AbstractEntityMetaData && entityMetaData.inheritance.parentType) {
            const columnMeta: ColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, entityMetaData.type, propertyKey);
            const inheritColumnMeta = new InheritedColumnMetaData(columnMeta, entityMetaData.inheritance.parentType, propertyKey);
            Reflect.defineMetadata(columnMetaKey, inheritColumnMeta, entityMetaData.type, propertyKey);
            Reflect.defineMetadata(columnMetaKey, columnMeta, entityMetaData.inheritance.parentType, propertyKey);
        }
    };
}
