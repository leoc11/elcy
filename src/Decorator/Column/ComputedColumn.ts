import { IObjectType, StringKeyOf, ValueType } from "../../Common/Type";
import { ExpressionBuilder } from "../../ExpressionBuilder/ExpressionBuilder";
import { isNotNull } from "../../Helper/Util";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { ComputedColumnMetaData } from "../../MetaData/ComputedColumnMetaData";
import { getEntityMetadata, setColumnMetadata, setEntityMetadata } from "../../MetaData/MetaDataMapper";

// TODO: types: Persisted, Virtual, Query
export function ComputedColumn<TE extends object = object, K extends StringKeyOf<TE> = StringKeyOf<TE>, T extends TE[K] & ValueType = TE[K] & ValueType>(fn: (o: TE) => T): PropertyDecorator & MethodDecorator {
    return <R>(target: TE, propertyKey: K, descriptor?: TypedPropertyDescriptor<R & T>) => {
        const isAccessor = isNotNull(descriptor);
        let entityMetaData = getEntityMetadata(target.constructor as IObjectType<TE>);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as IObjectType<TE>);
            setEntityMetadata(target.constructor as IObjectType<TE>, entityMetaData);
        }
        const fnExp = ExpressionBuilder.parse(fn, [entityMetaData.type]);
        const computedMetaData = new ComputedColumnMetaData(entityMetaData, fnExp, propertyKey);
        entityMetaData.columns.push(computedMetaData);
        setColumnMetadata(target.constructor as IObjectType<TE>, propertyKey, computedMetaData);

        // add property to use setter getter.
        if (!isAccessor) {
            descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
            if (descriptor?.configurable === false) {
                throw new Error(`Cannot decorate property '${propertyKey}' because it not configurable`);
            }
        }

        if (!descriptor) {
            descriptor = {
                writable: true,
                enumerable: true,
                configurable: true
            };
        }

        if (descriptor.writable) {
            const privatePropertySymbol = Symbol(`_${propertyKey}`);
            Object.defineProperty(target, privatePropertySymbol, {
                value: descriptor.value,
                enumerable: false,
                writable: true,
                configurable: false
            });

            descriptor = {
                get: function (this: any) {
                    const value = this[privatePropertySymbol];
                    if (typeof value === "undefined") {
                        try {
                            return this[privatePropertySymbol] = fn(this);
                        } catch { }
                    }
    
                    return value;
                },
                set: function (this: TE, value: T) {
                    this[privatePropertySymbol] = value;
                },
                enumerable: descriptor.enumerable,
                configurable: descriptor.configurable
            };

            Object.defineProperty(target, propertyKey, descriptor);
        }
        else {
            const ori_Get = descriptor?.get;
            const ori_Set = descriptor?.set;
            
            descriptor.set = function (this: TE, value: T) {
                ori_Set?.call(this, value);
            };
            descriptor.get = function (this: any) {
                let value = ori_Get?.call(this);
                if (typeof value === "undefined") {
                    try {
                        value = fn(this) as R & T;
                        ori_Set?.call(this, value);
                    } catch { }
                }

                return value;
            }
        }

        return descriptor;
    };
}
