import { BigIntColumnMetaData } from "src/MetaData/BigIntColumnMetaData";
import { IBigIntColumnOption } from "../Option/IBigIntColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function BigIntColumn<TE extends object>(option?: IBigIntColumnOption): ClassPropertyDecorator<TE, bigint>;
export function BigIntColumn<TE extends object>(name?: string, defaultValue?: () => bigint): ClassPropertyDecorator<TE, bigint>;
export function BigIntColumn<TE extends object>(optionOrName?: string | IBigIntColumnOption, defaultValue?: () => bigint): ClassPropertyDecorator<TE, bigint> {
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

    return Column<TE, bigint>(BigInt, BigIntColumnMetaData, option);
}
