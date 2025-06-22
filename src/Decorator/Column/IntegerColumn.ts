import { IntegerColumnMetaData } from "../../MetaData/IntegerColumnMetaData";
import { INumericColumnOption } from "../Option/INumericColumnOption";
import { Column } from "./Column";

export function IntegerColumn(option?: INumericColumnOption): PropertyDecorator & MethodDecorator;
export function IntegerColumn(name?: string, defaultValue?: () => number): PropertyDecorator & MethodDecorator;
export function IntegerColumn(optionOrName?: string | INumericColumnOption, defaultValue?: () => number): PropertyDecorator & MethodDecorator {
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

    return Column<any, any, number>(IntegerColumnMetaData, option);
}
