import { IObjectType, StringKeyOf, ValueType } from "../../Common/Type";
import { IEventDispacher } from "../../Event/IEventHandler";
import { arrayDelete, isEqual, isNotNull } from "../../Helper/Util";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { IChangeEventParam } from "../../MetaData/Interface/IChangeEventParam";
import { propertyChangeDispatherMetaKey } from "../DecoratorKey";
import { AbstractEntity } from "../Entity/AbstractEntity";
import { IColumnOption } from "../Option/IColumnOption";
import { getColumnMetadata, getEntityMetadata, setColumnMetadata } from "../../MetaData/MetaDataMapper";

export function Column<TE extends object = object, K extends StringKeyOf<TE> = StringKeyOf<TE>, T extends TE[K] & ValueType = TE[K] & ValueType>(columnMetaType: IObjectType<ColumnMetaData<TE, T>>, columnOption: IColumnOption): PropertyDecorator & MethodDecorator {
    return <R>(target: TE, propertyKey: K, descriptor?: TypedPropertyDescriptor<T & R>) => {
        const isAccessor = isNotNull(descriptor);
        let entityMetaData = getEntityMetadata(target.constructor as IObjectType<TE>);
        if (!entityMetaData) {
            AbstractEntity()(target.constructor as ObjectConstructor);
            entityMetaData = getEntityMetadata(target.constructor as IObjectType<TE>);
        }

        const metadata = new columnMetaType();
        metadata.isProjected = true;
        metadata.applyOption(columnOption as any);
        if (!metadata.columnName) {
            metadata.columnName = propertyKey;
        }
        metadata.propertyName = propertyKey;

        const existingMetaData = getColumnMetadata<TE, K, T>(target.constructor as IObjectType<TE>, propertyKey);
        if (existingMetaData != null) {
            metadata.applyOption(existingMetaData);
            arrayDelete(entityMetaData.columns, existingMetaData);
        }
        setColumnMetadata(target.constructor as IObjectType<TE>, propertyKey, metadata);
        entityMetaData.columns.push(metadata);

        const pk = entityMetaData.primaryKeys.find((o) => o.propertyName === metadata.propertyName);
        if (pk) {
            entityMetaData.primaryKeys.delete(pk);
            entityMetaData.primaryKeys.push(metadata);
        }

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
                    return this[privatePropertySymbol];
                },
                set: function (this: TE, value: T) {
                    const oldValue = this[privatePropertySymbol];
                    // tslint:disable-next-line:triple-equals
                    if (!isEqual(oldValue, value)) {
                        this[privatePropertySymbol] = value;
    
                        const propertyChangeDispatcher: IEventDispacher<IChangeEventParam<TE>> = this[propertyChangeDispatherMetaKey];
                        if (propertyChangeDispatcher) {
                            propertyChangeDispatcher({
                                column: metadata,
                                oldValue,
                                newValue: value
                            });
                        }
                    }
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
                const oldValue = ori_Get?.call(this);
                if (!isEqual(oldValue, value)) {
                    ori_Set?.call(this, value);

                    const propertyChangeDispatcher: IEventDispacher<IChangeEventParam<TE>> = this[propertyChangeDispatherMetaKey];
                    if (propertyChangeDispatcher) {
                        propertyChangeDispatcher({
                            column: metadata,
                            oldValue,
                            newValue: value
                        });
                    }
                }
            };
            descriptor.get = function (this: any) {
                return ori_Get?.call(this);
            }
        }

        return descriptor;
    };
}