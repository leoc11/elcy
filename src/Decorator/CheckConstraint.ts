import "reflect-metadata";
import { GenericType } from "../Common/Type";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { entityMetaKey } from "./DecoratorKey";
import { AbstractEntityMetaData } from "../MetaData/AbstractEntityMetaData";
import { ICheckConstraintOption } from "./Option/ICheckConstraintOption";
import { CheckConstraintMetaData } from "../MetaData/CheckConstraintMetaData";

export function CheckContraint(option: ICheckConstraintOption): (target: object, propertyKey?: string | symbol) => void;
export function CheckContraint<T>(check: (entity: T) => boolean): (target: object, propertyKey?: string | symbol) => void;
export function CheckContraint<T>(name: string, check: (entity: T) => boolean): (target: object, propertyKey?: string | symbol) => void;
export function CheckContraint<T>(optionOrCheckOrName: ICheckConstraintOption | string | ((entity: T) => boolean), check?: (entity: T) => boolean): (target: object, propertyKey?: string | symbol) => void {
    let option: ICheckConstraintOption = {} as any;
    switch (typeof optionOrCheckOrName) {
        case "object":
            option = optionOrCheckOrName as any;
            break;
        case "function":
            option.check = optionOrCheckOrName as any;
            break;
        case "string":
            option.name = optionOrCheckOrName as any;
            break;
    }
    if (check)
        option.check = check;

    return (target: GenericType<T> | object, propertyKey?: keyof T /* | symbol*//*, descriptor: PropertyDescriptor*/) => {
        const entConstructor: GenericType<T> = propertyKey ? target.constructor as any : target;
        if (!option.name)
            option.name = `CK_${entConstructor.name}_${(propertyKey ? propertyKey : (target as GenericType<T>).name)}`;

        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, entConstructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as any);
        }

        let checkMetaData = entityMetaData.constraints.first(o => o instanceof CheckConstraintMetaData && o.name === option.name);
        if (checkMetaData) {
            entityMetaData.constraints.remove(checkMetaData);
        }
        checkMetaData = new CheckConstraintMetaData(option.name, entityMetaData, option.check);
        entityMetaData.constraints.push(checkMetaData);
        Reflect.defineMetadata(entityMetaKey, entityMetaData, entConstructor);
    };
}
