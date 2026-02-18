import { IntegerColumnMetaData } from "../../MetaData/IntegerColumnMetaData";
import { INumericColumnOption } from "../Option/INumericColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function IntegerColumn<TE extends object, T extends (number | undefined)>(option?: INumericColumnOption): ClassPropertyDecorator<TE, T>;
export function IntegerColumn<TE extends object, T extends (number | undefined)>(name?: string, defaultValue?: () => number): ClassPropertyDecorator<TE, T>;
export function IntegerColumn<TE extends object, T extends (number | undefined)>(optionOrName?: string | INumericColumnOption, defaultValue?: () => number): ClassPropertyDecorator<TE, T> {
    let option: INumericColumnOption = {};
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

    return Column<TE, T>(IntegerColumnMetaData as any, option);
}
