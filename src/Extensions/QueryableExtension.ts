import { KeysExceptType, TypeItem, ValueType } from "../Common/Type";
import { relationMetaKey } from "../Decorator/DecoratorKey";
import { Enumerable } from "../Enumerable/Enumerable";
import { IRelationMetaData } from "../MetaData/Interface/IRelationMetaData";
import { Queryable } from "../Queryable/Queryable";

declare global {
    // tslint:disable-next-line:interface-name
    interface Array<T> {
        include(...includes: Array<(item: T) => unknown>): T[];
        project(...includes: Array<(item: T) => unknown>): T[];
    }
}
Array.prototype.include = function <T>(this: T[]): T[] {
    return this;
};
Array.prototype.project = function <T>(this: T[]): T[] {
    return this;
};

declare module "../Enumerable/Enumerable" {
    interface Enumerable<T> {
        include(...includes: Array<(item: T) => unknown>): Enumerable<T>;
        project(...includes: Array<(item: T) => unknown>): Enumerable<T>;
    }
}
Enumerable.prototype.include = function <T>(this: Enumerable<T>): Enumerable<T> {
    return this;
};
Enumerable.prototype.project = function <T>(this: Enumerable<T>): Enumerable<T> {
    return this;
};

declare module "../Queryable/Queryable" {
    interface Queryable<T> {
        asSubquery(): Enumerable<T>;
    }
}
Queryable.prototype.asSubquery = function <T>(this: Queryable<T>): Enumerable<T> {
    return this as unknown as Enumerable<T>;
};
declare global {
    namespace Reflect {
        export function getRelationData<M, S, SKey extends KeysExceptType<S, ValueType>>(source: S, relationProperty: SKey, target: TypeItem<S[SKey]>): M;
        export function setRelationData<M, S, SKey extends KeysExceptType<S, ValueType>>(source: S, relationProperty: SKey, target: TypeItem<S[SKey]>, value: M): void;
    }
}
Reflect.getRelationData = <M, S, SKey extends KeysExceptType<S, ValueType>>(source: S, relationProperty: SKey, target: TypeItem<S[SKey]>): M => {
    let relationMeta = Reflect.getOwnMetadata(relationMetaKey, source, relationProperty) as IRelationMetaData;
    if (!relationMeta.isMaster) {
        relationMeta = relationMeta.reverseRelation;
    }
    return Reflect.getOwnMetadata(target, source, relationProperty) as M;
};
Reflect.setRelationData = <M, S, SKey extends KeysExceptType<S, ValueType>>(source: S, relationProperty: SKey, target: TypeItem<S[SKey]>, value: M) => {
    let relationMeta = Reflect.getOwnMetadata(relationMetaKey, source.constructor, relationProperty) as IRelationMetaData;
    if (!relationMeta.isMaster) {
        relationMeta = relationMeta.reverseRelation;
    }
    return Reflect.defineMetadata(target, value, source, relationProperty);
};
