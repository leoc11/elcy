import "reflect-metadata";
import { columnMetaKey, entityMetaKey, relationMetaKey } from "../Decorator/DecoratorKey";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IObjectType, StringKeyOf, ValueType } from "../Common/Type";
import { IRelationMetaData } from "./Interface/IRelationMetaData";

export function getEntityMetadata<TE extends object>(constructor: IObjectType<TE>): IEntityMetaData<TE> {
    return Reflect.getOwnMetadata(entityMetaKey, constructor);
}
export function setEntityMetadata<TE extends object>(constructor: IObjectType<TE>, metadata: IEntityMetaData<TE>): void {
    Reflect.defineMetadata(entityMetaKey, metadata, constructor);
}
export function getColumnMetadata<TE extends object, K extends StringKeyOf<TE>, T extends ValueType & TE[K] = TE[K] & ValueType>(constructor: IObjectType<TE>, propertyKey: K): IColumnMetaData<TE, T> {
    return Reflect.getOwnMetadata(columnMetaKey, constructor, propertyKey);
}
export function setColumnMetadata<TE extends object, K extends StringKeyOf<TE>, T extends ValueType & TE[K] = TE[K] & ValueType>(constructor: IObjectType<TE>, propertyKey: K, metadata: IColumnMetaData<TE, T>): void {
    Reflect.defineMetadata(columnMetaKey, metadata, constructor, propertyKey);
}
export function getRelationMetadata<TE extends object, K extends StringKeyOf<TE>, T extends TE[K] & object = TE[K] & object>(constructor: IObjectType<TE>, propertyKey: K): IRelationMetaData<TE, T> {
    return Reflect.getOwnMetadata(relationMetaKey, constructor, propertyKey);
}
export function setRelationMetadata<TE extends object, K extends StringKeyOf<TE>, T extends object & TE[K] = TE[K] & object>(constructor: IObjectType<TE>, propertyKey: K, metadata: IRelationMetaData<TE, T>): void {
    Reflect.defineMetadata(relationMetaKey, metadata, constructor, propertyKey);
}
