import "reflect-metadata";
import { columnMetaKey, entityMetaKey } from "../Decorator/DecoratorKey";
import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { StringKeyOf, ValueType } from "../Common/Type";

export function getEntityMetadata<TE extends object>(prototype: TE): IEntityMetaData<TE> {
    return Reflect.getOwnMetadata(entityMetaKey, prototype.constructor);
}
export function setEntityMetadata<TE extends object>(prototype: TE, metadata: IEntityMetaData<TE>): void {
    Reflect.defineMetadata(entityMetaKey, metadata, prototype.constructor);
}
export function getColumnMetadata<TE extends object, K extends StringKeyOf<TE>, T extends ValueType & TE[K] = TE[K] & ValueType>(prototype: TE, propertyKey: K): IColumnMetaData<TE, T> {
    return Reflect.getOwnMetadata(columnMetaKey, prototype.constructor, propertyKey);
}
export function setColumnMetadata<TE extends object, K extends StringKeyOf<TE>, T extends ValueType & TE[K] = TE[K] & ValueType>(prototype: TE, propertyKey: K, metadata: IColumnMetaData<TE, T>): void {
    Reflect.defineMetadata(columnMetaKey, metadata, prototype.constructor, propertyKey);
}
