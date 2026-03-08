import type Decimal from "decimal.js";
import { DecimalColumnMetaData } from "../../MetaData/DecimalColumnMetaData";
import { IDecimalColumnOption } from "../Option/IDecimalColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function DecimalColumn<TE extends object>(option?: IDecimalColumnOption): ClassPropertyDecorator<TE, string | number | Decimal>;
export function DecimalColumn<TE extends object>(optionOrName?: string | IDecimalColumnOption, defaultValue?: () => number | Decimal): ClassPropertyDecorator<TE, string | number | Decimal> {
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
    return Column<TE, string | number | Decimal>(option.type ?? String, DecimalColumnMetaData, option);
}
