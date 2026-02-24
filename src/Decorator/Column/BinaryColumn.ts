import { GenericType } from "../../Common/Type";
import { BinaryColumnMetaData } from "../../MetaData/BinaryColumnMetaData";
import { IBinaryColumnOption } from "../Option/IBinaryColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function BinaryColumn<TE extends object>(option?: IBinaryColumnOption): ClassPropertyDecorator<TE, ArrayBufferView>;
export function BinaryColumn<TE extends object>(optionOrType?: GenericType<ArrayBufferView> | IBinaryColumnOption, name?: string, defaultValue?: () => ArrayBufferView): ClassPropertyDecorator<TE, ArrayBufferView> {
    let option: IBinaryColumnOption;
    if (optionOrType && typeof optionOrType !== "function") {
        option = optionOrType;
    }
    else {
        option = {};
        if (typeof optionOrType !== "undefined") {
            option.type = optionOrType as GenericType<ArrayBufferView>;
        }
        if (typeof name !== "undefined") {
            option.columnName = name;
        }
        if (typeof defaultValue !== "undefined") {
            option.default = defaultValue;
        }
    }
    return Column<TE, ArrayBufferView>(option.type ?? Uint8Array, BinaryColumnMetaData, option);
}
