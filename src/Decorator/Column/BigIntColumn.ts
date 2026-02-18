import { BigIntColumnMetaData } from "src/MetaData/BigIntColumnMetaData";
import { IBigIntColumnOption } from "../Option/IBigIntColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function BigIntColumn<TE extends object, T extends bigint>(option?: IBigIntColumnOption): ClassPropertyDecorator<TE, T>;
export function BigIntColumn<TE extends object, T extends bigint>(name?: string, defaultValue?: () => bigint): ClassPropertyDecorator<TE, T>;
export function BigIntColumn<TE extends object, T extends bigint>(optionOrName?: string | IBigIntColumnOption, defaultValue?: () => bigint): ClassPropertyDecorator<TE, T> {
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

    return Column<TE, T>(BigIntColumnMetaData as any, option);
}
