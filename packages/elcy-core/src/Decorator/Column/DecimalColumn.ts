import { DecimalColumnMetaData } from "../../MetaData/DecimalColumnMetaData";
import { IDecimalColumnOption } from "../Option/IDecimalColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";
import { DecimalValueType } from "src/Common/Type";

export function DecimalColumn<TE extends object, T extends DecimalValueType>(option?: IDecimalColumnOption<T>): ClassPropertyDecorator<TE, DecimalValueType>;
export function DecimalColumn<TE extends object, T extends DecimalValueType>(optionOrName?: string | IDecimalColumnOption<T>, defaultValue?: () => T): ClassPropertyDecorator<TE, DecimalValueType> {
    let option: IDecimalColumnOption<T> = {};
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
    return Column<TE, DecimalValueType>(option.type ?? String, DecimalColumnMetaData, option);
}
