import { IObjectType, StringKeyOf } from "../Common/Type";
import { AbstractEntityMetaData } from "../MetaData/AbstractEntityMetaData";
import { CheckConstraintMetaData } from "../MetaData/CheckConstraintMetaData";
import { getEntityMetadata, setEntityMetadata } from "../MetaData/MetaDataMapper";
import { ICheckConstraintOption } from "./Option/ICheckConstraintOption";

export function CheckContraint<TE extends object = object>(option: ICheckConstraintOption<TE>): ClassDecorator & PropertyDecorator & MethodDecorator;
export function CheckContraint<TE extends object = object>(check: (entity: TE) => boolean): ClassDecorator & PropertyDecorator & MethodDecorator;
export function CheckContraint<TE extends object = object>(name: string, check: (entity: TE) => boolean): ClassDecorator & PropertyDecorator & MethodDecorator;
export function CheckContraint<TE extends object = object>(optionOrCheckOrName: ICheckConstraintOption | string | ((entity: TE) => boolean), check?: (entity: TE) => boolean): ClassDecorator & PropertyDecorator & MethodDecorator {
    let option: ICheckConstraintOption<TE> = {} as any;
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
    if (check) {
        option.check = check;
    }

    return <T, TC extends Function = IObjectType<TE>>(target: TC | TE, propertyKey?: StringKeyOf<TE>, descriptor?: TypedPropertyDescriptor<T>) => {
        const entConstructor: IObjectType<TE> = propertyKey ? target.constructor as IObjectType<TE> : target as IObjectType<TE>;
        if (!option.name) {
            option.name = `CK_${entConstructor.name}_${(propertyKey ? propertyKey : "")}`;
        }

        let entityMetaData = getEntityMetadata(entConstructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(entConstructor);
        }

        let checkMetaData = entityMetaData.constraints.find((o) => o instanceof CheckConstraintMetaData && o.name === option.name);
        if (checkMetaData) {
            entityMetaData.constraints.delete(checkMetaData);
        }
        checkMetaData = new CheckConstraintMetaData(option.name, entityMetaData, option.check);
        entityMetaData.constraints.push(checkMetaData);
        setEntityMetadata(entConstructor, entityMetaData);
    };
}