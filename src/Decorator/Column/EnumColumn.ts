import "reflect-metadata";
import { IEnumType, IObjectType } from "../../Common/Type";
import { EnumColumnMetaData } from "../../MetaData";
import { IEnumColumnOption } from "../Option/IEnumColumnOption";
import { Column } from "./Column";

export function EnumColumn<T extends string | number>(options: IEnumColumnOption<T>): PropertyDecorator;
export function EnumColumn<T extends string | number>(options: IEnumColumnOption<T> | IEnumType<T> | T[], defaultValue?: T): PropertyDecorator {
    let option: IEnumColumnOption<T> = { type: String as any };
    if (!Array.isArray(options) && (options as IEnumColumnOption<T>).options) {
        option = options;
    }
    else {
        option.options = options as IEnumType<T> | T[];
    }

    let valueOptions: T[] = [];
    if (!option.type && option.options) {
        if (Array.isArray(option.options)) {
            valueOptions = option.options;
            if (option.options.length > 0) {
                if (typeof option.options[0] === "number")
                    option.type = Number as any;
            }
            else
                throw new Error("enum empty");
        }
        else {
            const optionKeys = Object.keys(option.options);
            if (optionKeys.length > 0) {
                valueOptions = optionKeys.map((item) => (option.options as IEnumType<T>)[item]);
                if (typeof option.options[optionKeys[0]] === "number")
                    option.type = Number as any;
            }
            else {
                throw new Error("enum empty");
            }
        }
    }

    const metadata = new EnumColumnMetaData(option.type as IObjectType<T>, valueOptions);
    if (defaultValue)
        metadata.default = defaultValue;
    return Column(metadata);
}
