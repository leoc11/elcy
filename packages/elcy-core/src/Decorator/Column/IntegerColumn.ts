import { IntegerColumnMetaData } from "../../MetaData/IntegerColumnMetaData";
import { INumericColumnOption } from "../Option/INumericColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function IntegerColumn<TE extends object>(option?: INumericColumnOption): ClassPropertyDecorator<TE, number>;
export function IntegerColumn<TE extends object>(name?: string, defaultValue?: () => number): ClassPropertyDecorator<TE, number>;
export function IntegerColumn<TE extends object>(optionOrName?: string | INumericColumnOption, defaultValue?: () => number): ClassPropertyDecorator<TE, number> {
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

    return Column<TE, number>(Number, IntegerColumnMetaData, option);
}
