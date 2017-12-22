import "reflect-metadata";
import { EntityMetaData } from "../MetaData/EntityMetaData";
import { entityMetaKey } from "./DecoratorKey";

export function Entity<T>(type: { new(): T }, hasInheritance?: boolean, name?: string, defaultOrder?: (item: T) => any): (target: { new(): T }) => void {
    const metadata = new EntityMetaData(type, name, defaultOrder, hasInheritance);
    return Reflect.metadata(entityMetaKey, metadata);
}
