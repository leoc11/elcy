import "reflect-metadata";
import "../../Extensions/EnumerableExtension";
import { AbstractEntityMetaData, BooleanColumnMetaData, ColumnMetaData, DateColumnMetaData } from "../../MetaData";
import { IEntityMetaData } from "../../MetaData/Interface";
import { InheritedColumnMetaData } from "../../MetaData/Relation";
import { columnMetaKey, entityMetaKey } from "../DecoratorKey";
import { AbstractEntity } from "../Entity";
import { IColumnOption } from "../Option";
import { EventListener } from "../../Common/EventListener";
import { IChangeEventParam } from "../../MetaData/Interface/IChangeEventParam";
import { IObjectType } from "../../Common/Type";

export function Column<TE = any, T = any>(columnMetaType: IObjectType<ColumnMetaData<TE, T>>, columnOption: IColumnOption): PropertyDecorator {
    return (target: TE, propertyKey: keyof TE /* | symbol*//*, descriptor: PropertyDescriptor*/) => {
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (!entityMetaData) {
            AbstractEntity()(target.constructor as ObjectConstructor);
            entityMetaData = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        }

        const metadata = new columnMetaType();
        if (!metadata.columnName) {
            if (typeof (propertyKey) === "string")
                metadata.columnName = propertyKey;
        }
        if (!metadata.propertyName) {
            metadata.propertyName = propertyKey;
        }

        const columnMetaData: ColumnMetaData<TE, T> = Reflect.getOwnMetadata(columnMetaKey, target.constructor, propertyKey);
        if (columnMetaData != null) {
            metadata.applyOption(columnMetaData);
            entityMetaData.properties.remove(columnMetaData);
        }
        Reflect.defineMetadata(columnMetaKey, metadata, target.constructor, propertyKey);
        entityMetaData.properties.push(metadata);

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

        if (entityMetaData instanceof AbstractEntityMetaData && entityMetaData.inheritance.parentType) {
            const inheritColumnMeta = new InheritedColumnMetaData(columnMetaData, entityMetaData.inheritance.parentType, propertyKey);
            Reflect.defineMetadata(columnMetaKey, inheritColumnMeta, entityMetaData.type, propertyKey);
            Reflect.defineMetadata(columnMetaKey, columnMetaData, entityMetaData.inheritance.parentType, propertyKey);
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
                        changeListener.emit({ property: propertyKey, oldValue, newValue: value });
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
