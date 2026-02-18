import { IEnumType } from "../../Common/Type";
import { EnumColumnMetaData } from "../../MetaData/EnumColumnMetaData";
import { IEnumColumnOption } from "../Option/IEnumColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function EnumColumn<TE extends object, T extends string | number>(options: IEnumColumnOption<T>): ClassPropertyDecorator<TE, T>;
export function EnumColumn<TE extends object, T extends string | number>(options: IEnumType<any> | T[], defaultValue?: () => T): ClassPropertyDecorator<TE, T>;
export function EnumColumn<TE extends object, T extends string | number>(options: IEnumColumnOption<T> | IEnumType<any> | T[], defaultValue?: () => T): ClassPropertyDecorator<TE, T> {
    let option: IEnumColumnOption<T> = { type: String as any };
    if (!Array.isArray(options) && (options as IEnumColumnOption<T>).options) {
        option = options;
    }
    else {
        option.options = options as IEnumType<any> | T[];
        if (defaultValue) {
            option.default = defaultValue;
        }
    }

    let valueOptions: T[] = [];
    if (option.options) {
        if (Array.isArray(option.options)) {
            valueOptions = option.options;
            if (option.options.length > 0) {
                if (typeof option.options[0] === "number") {
                    option.type = Number as any;
                }
            }
            else {
                throw new Error("enum empty");
            }
        }
        else {
            const optionKeys = Object.keys(option.options);
            if (optionKeys.length > 0) {
                valueOptions = optionKeys.map((item) => (option.options as IEnumType<T>)[item]);
                if (typeof option.options[optionKeys[0]] === "number") {
                    option.type = Number as any;
                }
            }
            else {
                throw new Error("enum empty");
            }
        }
    }
    option.options = valueOptions;
    return Column<TE, T>(EnumColumnMetaData<TE, T>, option);
}
