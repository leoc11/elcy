import "reflect-metadata";
import { IEnumType, IObjectType } from "../../Common/Type";
import { EnumColumnMetaData } from "../../MetaData";
import { Column } from "./Column";
import { IEnumColumnOption } from "../Option/IEnumColumnOption";

export function EnumColumn<T extends string | number>(options: IEnumColumnOption<T>): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void;
export function EnumColumn<T extends string | number>(options: IEnumColumnOption<T> | IEnumType<T> | T[], defaultValue?: T): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
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
    return Column(metadata);
}
