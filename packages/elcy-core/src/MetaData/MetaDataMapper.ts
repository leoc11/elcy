import { IEntityMetaData } from "./Interface/IEntityMetaData";
import { IColumnMetaData } from "./Interface/IColumnMetaData";
import { IObjectType, StringKeyOf, ValueType } from "../Common/Type";
import { IRelationMetaData } from "./Interface/IRelationMetaData";

const entityMetaMap = new WeakMap<IObjectType<any>, IEntityMetaData<any>>();
const columnMetaMap = new WeakMap<IObjectType<any>, Map<string, IColumnMetaData<any, any>>>();
const relationMetaMap = new WeakMap<IObjectType<any>, Map<string, IRelationMetaData<any, any>>>();

export function getEntityMetadata<TE extends object>(constructor: IObjectType<TE>): IEntityMetaData<TE> {
    return entityMetaMap.get(constructor);
}
export function setEntityMetadata<TE extends object>(constructor: IObjectType<TE>, metadata: IEntityMetaData<TE>): void {
    entityMetaMap.set(constructor, metadata);
}
export function getColumnMetadata<TE extends object, K extends StringKeyOf<TE>, T extends ValueType & TE[K] = TE[K] & ValueType>(constructor: IObjectType<TE>, propertyKey: K): IColumnMetaData<TE, T> {
    return columnMetaMap.get(constructor)?.get(propertyKey);
}
export function setColumnMetadata<TE extends object, K extends StringKeyOf<TE>, T extends ValueType & TE[K] = TE[K] & ValueType>(constructor: IObjectType<TE>, propertyKey: K, metadata: IColumnMetaData<TE, T>): void {
    let map = columnMetaMap.get(constructor);
    if (!map) {
        map = new Map();
        columnMetaMap.set(constructor, map);
    }
    map.set(propertyKey, metadata);
}
export function getRelationMetadata<TE extends object, K extends StringKeyOf<TE>, T extends TE[K] & object = TE[K] & object>(constructor: IObjectType<TE>, propertyKey: K): IRelationMetaData<TE, T> {
    return relationMetaMap.get(constructor)?.get(propertyKey);
}
export function setRelationMetadata<TE extends object, K extends StringKeyOf<TE>, T extends object & TE[K] = TE[K] & object>(constructor: IObjectType<TE>, propertyKey: K, metadata: IRelationMetaData<TE, T>): void {
    let map = relationMetaMap.get(constructor);
    if (!map) {
        map = new Map();
        relationMetaMap.set(constructor, map);
    }
    map.set(propertyKey, metadata);
}