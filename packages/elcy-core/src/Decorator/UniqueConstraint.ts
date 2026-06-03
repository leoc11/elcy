import { Enumerable } from "@elcy/enumerable";
import { IObjectType, StringKeyOf, ValueType } from "../Common/Type";
import { FunctionHelper } from "../Helper/FunctionHelper";
import { UniqueConstraintMetaData } from "../MetaData/UniqueConstraintMetaData";
import { IUniqueConstraintOption } from "./Option/IUniqueConstraintOption";
import { getColumnMetadata } from "../MetaData/MetaDataMapper";
import { ClassPropertyDecorator, ClassDecorator } from "./Type";
import { IEntityMetaData } from "src/MetaData";

export function UniqueConstraint<TE extends object>(name?: string): ClassPropertyDecorator<TE, ValueType>;
export function UniqueConstraint<TE extends object>(option: IUniqueConstraintOption<TE>): ClassDecorator<IObjectType<TE>>;
export function UniqueConstraint<TE extends object>(nameOrOption?: string | IUniqueConstraintOption<TE>): ClassPropertyDecorator<TE, ValueType> & ClassDecorator<IObjectType<TE>> {
    let option: IUniqueConstraintOption<TE>;
    if (typeof nameOrOption === "string") {
        option = { name: nameOrOption };
    }
    else {
        option = nameOrOption ?? {};
    }

    return (_: unknown, context: ClassAccessorDecoratorContext<TE> | ClassFieldDecoratorContext<TE> | ClassDecoratorContext<IObjectType<TE>>) => {
        let handlers = context.metadata.behaviors as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(handlers)) {
            context.metadata.behaviors = handlers = [];
        }

        if (context.kind != "class") {
            option.properties = [context.name as StringKeyOf<TE>];
        }

        handlers.push(entityMeta => {
            if (!option.name) {
                option.name = `UQ_${entityMeta.name}_${option.properties.join("_")}`;
            }

            const columns = Enumerable.from(option.properties)
                .map((o) => typeof o === "string" ? o : FunctionHelper.propertyName(o))
                .map((o) => getColumnMetadata(entityMeta.type, o))
                .filter((o) => !!o)
                .toArray();
            const checkMetaData = new UniqueConstraintMetaData(option.name, entityMeta, columns);
            entityMeta.constraints.push(checkMetaData);
        });
    };
}
