import "reflect-metadata";
import { GenericType } from "../Common/Type";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { entityMetaKey, columnMetaKey } from "./DecoratorKey";
import { AbstractEntityMetaData } from "../MetaData/AbstractEntityMetaData";
import { IUniqueConstraintOption } from "./Option/IUniqueConstraintOption";
import { FunctionHelper } from "../Helper/FunctionHelper";
import { UniqueConstraintMetaData } from "../MetaData/UniqueConstraintMetaData";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";

export function UniqueConstraint<T>(option?: IUniqueConstraintOption<T>): (target: object, propertyKey?: string | symbol) => void;
export function UniqueConstraint<T>(properties: Array<keyof T | ((item: T) => any)>): (target: object, propertyKey?: string | symbol) => void;
export function UniqueConstraint<T>(name: string, properties: Array<string | ((item: T) => any)>): (target: object, propertyKey?: string | symbol) => void;
export function UniqueConstraint<T>(optionOrPropertiesOrName?: IUniqueConstraintOption<T> | string | Array<keyof T | ((item: T) => any)>, properties?: Array<string | ((item: T) => any)>): (target: object, propertyKey?: string | symbol) => void {
    let option: IUniqueConstraintOption<T> = {};
    switch (typeof optionOrPropertiesOrName) {
        case "object":
            option = optionOrPropertiesOrName as any;
            break;
        case "function":
            properties = optionOrPropertiesOrName as any;
            break;
        case "string":
            option.name = optionOrPropertiesOrName as any;
            break;
    }
    if (properties)
        option.properties = properties.select((item) => {
            if (typeof item === "string")
                return item as keyof T;
            return FunctionHelper.propertyName<T>(item);
        }).toArray();

    return (target: GenericType<T> | object, propertyKey?: keyof T /*, descriptor: PropertyDescriptor*/) => {
        const entConstructor: GenericType<T> = propertyKey ? target.constructor as any : target;
        if (!option.name)
            option.name = `UQ_${entConstructor.name}${(option.properties ? "_" + option.properties.join("_") : propertyKey ? "_" + propertyKey : "")}`;
        if (propertyKey) {
            option.properties = [propertyKey];
        }
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, entConstructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as any);
        }

        let checkMetaData = entityMetaData.constraints.first(o => o instanceof UniqueConstraintMetaData && o.name === option.name);
        if (checkMetaData) {
            entityMetaData.constraints.remove(checkMetaData);
        }
        const columns = option.properties
            .select(o => Reflect.getOwnMetadata(columnMetaKey, entityMetaData.type, o) as IColumnMetaData)
            .where(o => !!o)
            .toArray();
        checkMetaData = new UniqueConstraintMetaData(option.name, entityMetaData, columns);
        entityMetaData.constraints.push(checkMetaData);
        Reflect.defineMetadata(entityMetaKey, entityMetaData, entConstructor);
    };
}
