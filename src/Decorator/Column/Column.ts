import "reflect-metadata";
import "../../Extensions/EnumerableExtension";
import { BooleanColumnMetaData, ColumnMetaData, DateColumnMetaData } from "../../MetaData";
import { IEntityMetaData } from "../../MetaData/Interface";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";
import { AbstractEntity } from "../Entity";
import { IColumnOption } from "../Option";
import { EventListener } from "../../Common/EventListener";
import { IChangeEventParam } from "../../MetaData/Interface/IChangeEventParam";
import { IObjectType } from "../../Common/Type";

export function Column<TE = any, T = any>(columnMetaType: IObjectType<ColumnMetaData<TE, T>>, columnOption: IColumnOption): PropertyDecorator {
    return (target: TE, propertyKey: keyof TE) => {
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (!entityMetaData) {
            AbstractEntity()(target.constructor as ObjectConstructor);
            entityMetaData = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        }

        const metadata = new columnMetaType();
        metadata.applyOption(columnOption as any);
        if (!metadata.columnName) {
            if (typeof (propertyKey) === "string")
                metadata.columnName = propertyKey;
        }
        metadata.propertyName = propertyKey;

        const columnMetaData: ColumnMetaData<TE, T> = Reflect.getOwnMetadata(columnMetaKey, target.constructor, propertyKey);
        if (columnMetaData != null) {
            metadata.applyOption(columnMetaData);
            entityMetaData.columns.remove(columnMetaData);
        }
        Reflect.defineMetadata(columnMetaKey, metadata, target.constructor, propertyKey);
        entityMetaData.columns.push(metadata);

        const pk = entityMetaData.primaryKeys.first(o => o.propertyName === metadata.propertyName);
        if (pk) {
            entityMetaData.primaryKeys.remove(pk);
            entityMetaData.primaryKeys.push(metadata);
        }

        if (metadata instanceof DateColumnMetaData) {
            if (columnOption.isCreatedDate)
                entityMetaData.createDateColumn = metadata;
            else if (columnOption.isModifiedDate)
                entityMetaData.modifiedDateColumn = metadata;
        }
        else if (metadata instanceof BooleanColumnMetaData) {
            if (columnOption.isDeleteColumn)
                entityMetaData.deleteColumn = metadata;
        }

        // add property to use setter getter.
        const privatePropertySymbol = Symbol(propertyKey);
        let descriptor: PropertyDescriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
        let oldGet: any, oldSet: any;
        if (descriptor) {
            if (descriptor.get) {
                oldGet = descriptor.get;
            }
            if (descriptor.set) {
                oldSet = descriptor.set;
            }
        }
        descriptor = {
            set: function (this: any, value: T) {
                if (!oldGet && !this.hasOwnProperty(privatePropertySymbol)) {
                    Object.defineProperty(this, privatePropertySymbol, {
                        value: undefined,
                        enumerable: false,
                        writable: true,
                        configurable: true
                    });
                }
                const oldValue = this[propertyKey];
                // tslint:disable-next-line:triple-equals
                if (oldValue != value) {
                    if (oldSet)
                        oldSet.apply(this, value);
                    else
                        this[privatePropertySymbol] = value;

                    const changeListener: EventListener<IChangeEventParam> = Reflect.getOwnMetadata("PropertyChangeEventListener", this);
                    if (changeListener) {
                        changeListener.emit({ column: columnMetaData, oldValue, newValue: value });
                    }
                }
            },
            get: function (this: any) {
                if (oldGet)
                    return oldGet.apply(this);
                return this[privatePropertySymbol];
            },
            configurable: true,
            enumerable: true
        };

        Object.defineProperty(target, propertyKey, descriptor);
    };
}
