import Decimal from "decimal.js-light";
import { DecimalColumnMetaData } from "../../MetaData/DecimalColumnMetaData";
import { IDecimalColumnOption } from "../Option/IDecimalColumnOption";
import { Column } from "./Column";

export function DecimalColumn(option?: IDecimalColumnOption): PropertyDecorator & MethodDecorator;
export function DecimalColumn(optionOrName?: string | IDecimalColumnOption, defaultValue?: () => Decimal): PropertyDecorator & MethodDecorator {
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
    return Column<any, any, Decimal>(DecimalColumnMetaData, option);
}
