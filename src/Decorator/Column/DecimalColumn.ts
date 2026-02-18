import { DecimalColumnMetaData } from "../../MetaData/DecimalColumnMetaData";
import { IDecimalColumnOption } from "../Option/IDecimalColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function DecimalColumn<TE extends object, T extends number>(option?: IDecimalColumnOption): ClassPropertyDecorator<TE, T>;
export function DecimalColumn<TE extends object, T extends number>(optionOrName?: string | IDecimalColumnOption, defaultValue?: () => number): ClassPropertyDecorator<TE, T> {
    let option: IDecimalColumnOption = {};
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
    return Column<TE, T>(DecimalColumnMetaData as any, option);
}
