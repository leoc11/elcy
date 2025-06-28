import { BigIntegerColumnMetaData } from "../../MetaData/BigIntegerColumnMetaData";
import { IBigIntColumnOption } from "../Option/IBigIntColumnOption";
import { Column } from "./Column";

export function BigIntegerColumn(option?: IBigIntColumnOption): PropertyDecorator & MethodDecorator;
export function BigIntegerColumn(name?: string, defaultValue?: () => BigInt): PropertyDecorator & MethodDecorator;
export function BigIntegerColumn(optionOrName?: string | IBigIntColumnOption, defaultValue?: () => BigInt): PropertyDecorator & MethodDecorator {
    let option: IBigIntColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined") {
            option.columnName = optionOrName as string;
        }
        if (typeof defaultValue !== "undefined") {
            option.default = defaultValue;
        }
    }

    if (option.autoIncrement && option.default) {
        throw new Error("Auto increment cannot has default value");
    }

    return Column<any, any, BigInt>(BigIntegerColumnMetaData, option);
}
