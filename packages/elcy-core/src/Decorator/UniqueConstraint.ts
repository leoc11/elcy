import { Enumerable } from "@elcy/enumerable";
import { IObjectType, PropertySelector, StringKeyOf } from "../Common/Type";
import { FunctionHelper } from "../Helper/FunctionHelper";
import { AbstractEntityMetaData } from "../MetaData/AbstractEntityMetaData";
import { UniqueConstraintMetaData } from "../MetaData/UniqueConstraintMetaData";
import { IUniqueConstraintOption } from "./Option/IUniqueConstraintOption";
import { getColumnMetadata, getEntityMetadata, setEntityMetadata } from "../MetaData/MetaDataMapper";
import { ArrayExtension } from "src/Extensions/ArrayExtension";

export function UniqueConstraint<TE extends object>(option?: IUniqueConstraintOption<TE>): ClassDecorator & PropertyDecorator & MethodDecorator;
export function UniqueConstraint<TE extends object>(properties: Array<PropertySelector<TE>>): ClassDecorator & PropertyDecorator & MethodDecorator;
export function UniqueConstraint<TE extends object>(name: string, properties: Array<PropertySelector<TE>>): ClassDecorator & PropertyDecorator & MethodDecorator;
export function UniqueConstraint<TE extends object>(optionOrPropertiesOrName?: IUniqueConstraintOption<TE> | string | Array<PropertySelector<TE>>, properties?: Array<PropertySelector<TE>>): ClassDecorator & PropertyDecorator & MethodDecorator {
    let option: IUniqueConstraintOption<TE> = {};
    switch (true) {
        case Array.isArray(optionOrPropertiesOrName):
            properties = optionOrPropertiesOrName;
            break;
        case typeof optionOrPropertiesOrName === "object":
            option = optionOrPropertiesOrName;
            break;
        case typeof optionOrPropertiesOrName === "string":
            option.name = optionOrPropertiesOrName;
            break;
    }
    if (properties) {
        option.properties = properties;
    }

    return (target: IObjectType<TE> | object, propertyKey?: StringKeyOf<TE>, descriptor?: PropertyDescriptor) => {
        const entConstructor = (propertyKey ? target.constructor : target) as IObjectType<TE>;
        if (propertyKey) {
            option.properties = [propertyKey];
        }
        else {
            option.properties = option.properties
                .map((o) => typeof o === "string" ? o : FunctionHelper.propertyName(o));
        }

        if (!option.name) {
            option.name = `UQ_${entConstructor.name}${(option.properties ? "_" + option.properties.join("_") : "")}`;
        }

        let entityMetaData = getEntityMetadata(entConstructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(entConstructor);
        }

        let checkMetaData = entityMetaData.constraints.find((o) => o instanceof UniqueConstraintMetaData && o.name === option.name);
        if (checkMetaData) {
            ArrayExtension.delete(entityMetaData.constraints, checkMetaData);
        }
        const columns = Enumerable.from(option.properties)
            .map((o) => typeof o === "string" ? o : FunctionHelper.propertyName(o))
            .map((o) => getColumnMetadata(entityMetaData.type, o))
            .filter((o) => !!o)
            .toArray();
        checkMetaData = new UniqueConstraintMetaData(option.name, entityMetaData, columns);
        entityMetaData.constraints.push(checkMetaData);
        setEntityMetadata(entConstructor, entityMetaData);
    };
}
