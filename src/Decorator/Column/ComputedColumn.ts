import "reflect-metadata";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";

// TODO: types: Persisted, Virtual, Query
export function ComputedColumn<T = any, R = any>(fn: (o: T) => R): PropertyDecorator {
    return (target: T, propertyKey: keyof T) => {
        let entityMetaData: IEntityMetaData<T> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as any);
            Reflect.defineMetadata(entityMetaKey, entityMetaData, target.constructor);
        }
        const computedMetaData = new ComputedColumnMetaData(entityMetaData, fn, propertyKey);
        entityMetaData.columns.push(computedMetaData);
        Reflect.defineMetadata(columnMetaKey, computedMetaData, target.constructor, propertyKey);

        const privatePropertySymbol = Symbol(propertyKey);
        const descriptor: PropertyDescriptor = {
            set: function (this: any, value: R) {
                if (!this.hasOwnProperty(privatePropertySymbol)) {
                    Object.defineProperty(this, privatePropertySymbol, {
                        value: undefined,
                        enumerable: false,
                        writable: true,
                        configurable: true
                    });
                }
                (this as any)[privatePropertySymbol] = value;
            },
            get: function (this: T) {
                const value = (this as any)[privatePropertySymbol];
                if (typeof value === "undefined") {
                    try {
                        return fn(this);
                    } catch (e) { }
                }
                return (this as any)[privatePropertySymbol];
            },
            configurable: true,
            enumerable: true,
        };
        Object.defineProperty(target, propertyKey, descriptor);
    };
}
