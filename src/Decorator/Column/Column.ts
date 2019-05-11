import "reflect-metadata";
import { columnMetaKey, entityMetaKey, propertyChangeDispatherMetaKey } from "../DecoratorKey";
import { IChangeEventParam } from "../../MetaData/Interface/IChangeEventParam";
import { IObjectType } from "../../Common/Type";
import { IEventDispacher } from "../../Event/IEventHandler";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { IEntityMetaData } from "../../MetaData/Interface/IEntityMetaData";
import { AbstractEntity } from "../Entity/AbstractEntity";
import { IColumnOption } from "../Option/IColumnOption";
import { BooleanColumnMetaData } from "../../MetaData/BooleanColumnMetaData";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";
import { isEqual } from "../../Helper/Util";
import { IntegerColumnMetaData } from "../../MetaData/IntegerColumnMetaData";

export function Column<TE = any, T = any>(columnMetaType: IObjectType<ColumnMetaData<TE, T>>, columnOption: IColumnOption): PropertyDecorator {
    return (target: TE, propertyKey: keyof TE) => {
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        if (!entityMetaData) {
            AbstractEntity()(target.constructor as ObjectConstructor);
            entityMetaData = Reflect.getOwnMetadata(entityMetaKey, target.constructor);
        }

        const metadata = new columnMetaType();
        metadata.isProjected = true;
        metadata.applyOption(columnOption as any);
        if (!metadata.columnName) {
            metadata.columnName = propertyKey;
        }
        metadata.propertyName = propertyKey;

        const existingMetaData: ColumnMetaData<TE, T> = Reflect.getOwnMetadata(columnMetaKey, target.constructor, propertyKey);
        if (existingMetaData != null) {
            metadata.applyOption(existingMetaData);
            entityMetaData.columns.delete(existingMetaData);
        }
        Reflect.defineMetadata(columnMetaKey, metadata, target.constructor, propertyKey);
        entityMetaData.columns.push(metadata);

        const pk = entityMetaData.primaryKeys.first(o => o.propertyName === metadata.propertyName);
        if (pk) {
            entityMetaData.primaryKeys.delete(pk);
            entityMetaData.primaryKeys.push(metadata);
        }

        if (metadata instanceof DateTimeColumnMetaData) {
            if ((columnOption as IDateTimeColumnOption).isCreatedDate)
                entityMetaData.createDateColumn = metadata;
            else if ((columnOption as IDateTimeColumnOption).isModifiedDate)
                entityMetaData.modifiedDateColumn = metadata;
        }
        else if (metadata instanceof BooleanColumnMetaData) {
            if ((columnOption as IBooleanColumnOption).isDeletedColumn)
                entityMetaData.deletedColumn = metadata;
        }
        else if (metadata instanceof RowVersionColumnMetaData) {
            entityMetaData.versionColumn = metadata;
            if (!entityMetaData.concurrencyMode)
                entityMetaData.concurrencyMode = "OPTIMISTIC VERSION";
        }
        else if (metadata instanceof IntegerColumnMetaData) {
            if (metadata.autoIncrement && metadata.defaultExp)
                console.warn("Auto increment cannot has default value");
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
            set: function (this: any, value: any) {
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
                if (!isEqual(oldValue, value)) {
                    if (oldSet)
                        oldSet.apply(this, value);
                    else
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
