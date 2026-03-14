import { IEnumType } from "../../Common/Type";
import { EnumColumnMetaData } from "../../MetaData/EnumColumnMetaData";
import { IEnumColumnOption } from "../Option/IEnumColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function EnumColumn<TE extends object>(options: IEnumColumnOption): ClassPropertyDecorator<TE, string | number>;
export function EnumColumn<TE extends object>(options: IEnumType<any> | Array<string | number>, defaultValue?: () => string | number): ClassPropertyDecorator<TE, string | number>;
export function EnumColumn<TE extends object>(options: IEnumColumnOption | IEnumType<any> | Array<string | number>, defaultValue?: () => string | number): ClassPropertyDecorator<TE, string | number> {
    let option: IEnumColumnOption = {};
    if (!Array.isArray(options) && (options as IEnumColumnOption).options) {
        option = options;
    }
    else {
        option.options = options as IEnumType<any> | Array<string | number>;
        if (defaultValue) {
            option.default = defaultValue;
        }
    }

    let valueOptions: Array<string | number> = [];
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
                valueOptions = optionKeys.map((item) => (option.options as IEnumType<string | number>)[item]);
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
    return Column<TE, string | number>(option.type ?? String, EnumColumnMetaData<TE>, option);
}
