import { relationMetaKey } from "../Decorator/DecoratorKey";
import { Enumerable } from "../Enumerable/Enumerable";
import { RelationMetaData } from "../MetaData/Relation/RelationMetaData";
import { Queryable } from "../Queryable/Queryable";

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        include(...includes: Array<(item: T) => any>): T[];
        project(...includes: Array<(item: T) => any>): T[];
    }
}
Array.prototype.include = function <T>(this: T[], ...includes: Array<(item: T) => any>): T[] {
    return this;
};
Array.prototype.project = function <T>(this: T[], ...includes: Array<(item: T) => any>): T[] {
    return this;
};

declare module "../Enumerable/Enumerable" {
    interface Enumerable<T> {
        include(...includes: Array<(item: T) => any>): Enumerable<T>;
        project(...includes: Array<(item: T) => any>): Enumerable<T>;
    }
}
Enumerable.prototype.include = function <T>(this: Enumerable<T>, ...includes: Array<(item: T) => any>): Enumerable<T> {
    return this;
};
Enumerable.prototype.project = function <T>(this: Enumerable<T>, ...includes: Array<(item: T) => any>): Enumerable<T> {
    return this;
};

declare module "../Queryable/Queryable" {
    interface Queryable<T> {
        asSubquery(): Enumerable<T>;
    }
}
Queryable.prototype.asSubquery = function <T>(this: Queryable<T>): Enumerable<T> {
    return this as any;
};

declare global {
    namespace Reflect {
        export function getRelationData<M, S = any, SKey extends keyof S = any, T = any>(source: S, relationProperty: SKey, target: T): M;
        export function setRelationData<M, S = any, SKey extends keyof S = any, T = any>(source: S, relationProperty: SKey, target: T, value: M): void;
    }
}
Reflect.getRelationData = <M, S = any, SKey extends keyof S = any, T = any>(source: S, relationProperty: SKey, target: T): M => {
    const relationMeta: RelationMetaData<S, T> = Reflect.getOwnMetadata(relationMetaKey, source, relationProperty);
    if (relationMeta.isMaster) {
        return Reflect.getOwnMetadata(target, source, relationProperty);
    }
    return Reflect.getOwnMetadata(source, target, relationMeta.reverseRelation.propertyName);
};
Reflect.setRelationData = <M, S = any, SKey extends keyof S = any, T = any>(source: S, relationProperty: SKey, target: T, value: M) => {
    const relationMeta: RelationMetaData<S, T> = Reflect.getOwnMetadata(relationMetaKey, source.constructor, relationProperty);
    if (relationMeta.isMaster) {
        return Reflect.defineMetadata(target, value, source, relationProperty);
    }
    return Reflect.defineMetadata(source, value, target, relationMeta.reverseRelation.propertyName);
};
