import { ArrayExtension } from "src/Extensions/ArrayExtension";
import { IObjectType } from "../Common/Type";
import { CheckConstraintMetaData } from "../MetaData/CheckConstraintMetaData";
import { ICheckConstraintOption } from "./Option/ICheckConstraintOption";
import { ClassDecorator } from "./Type";
import { IEntityMetaData } from "src/MetaData";

export function CheckContraint<TE extends object = object>(option: ICheckConstraintOption<TE>): ClassDecorator<IObjectType<TE>>;
export function CheckContraint<TE extends object = object>(check: (entity: TE) => boolean): ClassDecorator<IObjectType<TE>>;
export function CheckContraint<TE extends object = object>(name: string, check: (entity: TE) => boolean): ClassDecorator<IObjectType<TE>>;
export function CheckContraint<TE extends object = object>(optionOrCheckOrName: ICheckConstraintOption | string | ((entity: TE) => boolean), check?: (entity: TE) => boolean): ClassDecorator<IObjectType<TE>> {
    let option: ICheckConstraintOption<TE> = {} as any;
    switch (typeof optionOrCheckOrName) {
        case "object":
            option = optionOrCheckOrName as ICheckConstraintOption<TE>;
            break;
        case "function":
            check = optionOrCheckOrName;
            break;
        case "string":
            option.name = optionOrCheckOrName;
            break;
    }

    if (check) {
        option.check = check;
    }

    return (type: IObjectType<TE>, context: ClassDecoratorContext<IObjectType<TE>>) => {
        let handlers = context.metadata.behaviors as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(handlers)) {
            context.metadata.behaviors = handlers = [];
        }

        if (!option.name) {
            option.name = `CK_${type.name}`;
        }

        handlers.push((entityMeta) => {
            let checkMetaData = entityMeta.constraints.find((o) => o instanceof CheckConstraintMetaData && o.name === option.name);
            if (checkMetaData) {
                ArrayExtension.delete(entityMeta.constraints, checkMetaData);
            }
            checkMetaData = new CheckConstraintMetaData(option.name, entityMeta, option.check);
            entityMeta.constraints.push(checkMetaData);
        });
    };
}