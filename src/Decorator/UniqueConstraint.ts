import "reflect-metadata";
import { GenericType, PropertySelector } from "../Common/Type";
import { FunctionHelper } from "../Helper/FunctionHelper";
import { AbstractEntityMetaData } from "../MetaData/AbstractEntityMetaData";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { UniqueConstraintMetaData } from "../MetaData/UniqueConstraintMetaData";
import { columnMetaKey, entityMetaKey } from "./DecoratorKey";
import { IUniqueConstraintOption } from "./Option/IUniqueConstraintOption";

export function UniqueConstraint<TE>(option?: IUniqueConstraintOption<TE>): (target: object, propertyKey?: string | symbol) => void;
export function UniqueConstraint<TE>(properties: Array<keyof TE | ((item: TE) => any)>): (target: object, propertyKey?: string | symbol) => void;
export function UniqueConstraint<TE>(name: string, properties: Array<PropertySelector<TE>>): (target: object, propertyKey?: string | symbol) => void;
export function UniqueConstraint<TE>(optionOrPropertiesOrName?: IUniqueConstraintOption<TE> | string | Array<PropertySelector<TE>>, properties?: Array<PropertySelector<TE>>): (target: object, propertyKey?: string | symbol) => void {
    let option: IUniqueConstraintOption<TE> = {};
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
    if (properties) {
        option.properties = properties;
    }

    return (target: GenericType<TE> | object, propertyKey?: keyof TE) => {
        const entConstructor: GenericType<TE> = propertyKey ? target.constructor as any : target;
        if (propertyKey) {
            option.properties = [propertyKey];
        }
        else {
            option.properties = option.properties
                .select((o) => typeof o === "string" ? o : FunctionHelper.propertyName(o))
                .toArray();
        }

        if (!option.name) {
            option.name = `UQ_${entConstructor.name}${(option.properties ? "_" + option.properties.join("_") : "")}`;
        }

        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, entConstructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as any);
        }

        let checkMetaData = entityMetaData.constraints.first((o) => o instanceof UniqueConstraintMetaData && o.name === option.name);
        if (checkMetaData) {
            entityMetaData.constraints.delete(checkMetaData);
        }
        const columns = option.properties
            .select((o) => Reflect.getOwnMetadata(columnMetaKey, entityMetaData.type, o as keyof TE) as IColumnMetaData)
            .where((o) => !!o)
            .toArray();
        checkMetaData = new UniqueConstraintMetaData(option.name, entityMetaData, columns);
        entityMetaData.constraints.push(checkMetaData);
        Reflect.defineMetadata(entityMetaKey, entityMetaData, entConstructor);
    };
}
