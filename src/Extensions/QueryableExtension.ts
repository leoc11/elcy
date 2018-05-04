import { Enumerable } from "../Enumerable/Enumerable";
import "../Enumerable/Enumerable.partial";
import { relationMetaKey } from "../Decorator/DecoratorKey";
import { RelationMetaData } from "../MetaData/Relation";


declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        include(...includes: Array<(item: T) => any>): T[];
    }
    namespace Reflect {
        export function getRelationData<M, S = any, SKey extends keyof S = any, T = any>(source: S, relationProperty: SKey, target: T): M;
        export function setRelationData<M, S = any, SKey extends keyof S = any, T = any>(source: S, relationProperty: SKey, target: T, value: M): void;
    }
}
declare module "../Enumerable/Enumerable" {
    interface Enumerable<T> {
        include(...includes: Array<(item: T) => any>): Enumerable<T>;
    }
}

Array.prototype.include = function <T>(this: T[], ...includes: Array<(item: T) => any>): T[] {
    return this;
};
Enumerable.prototype.include = function <T>(this: Enumerable<T>, ...includes: Array<(item: T) => any>): Enumerable<T> {
    return this;
};
Reflect.getRelationData = <M, S = any, SKey extends keyof S = any, T = any>(source: S, relationProperty: SKey, target: T): M => {
    const relationMeta: RelationMetaData<S, T> = Reflect.getOwnMetadata(relationMetaKey, source, relationProperty);
    if (relationMeta.isMaster)
        return Reflect.getOwnMetadata(target, source, relationProperty);
    return Reflect.getOwnMetadata(source, target, relationMeta.reverseRelation.propertyName);
};
Reflect.setRelationData = <M, S = any, SKey extends keyof S = any, T = any>(source: S, relationProperty: SKey, target: T, value: M) => {
    const relationMeta: RelationMetaData<S, T> = Reflect.getOwnMetadata(relationMetaKey, source.constructor, relationProperty);
    if (relationMeta.isMaster)
        return Reflect.defineMetadata(target, value, source, relationProperty);
    return Reflect.defineMetadata(source, value, target, relationMeta.reverseRelation.propertyName);
};