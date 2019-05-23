import "reflect-metadata";
import { GenericType } from "../../Common/Type";
import { BinaryColumnMetaData } from "../../MetaData/BinaryColumnMetaData";
import { IBinaryColumnOption } from "../Option/IBinaryColumnOption";
import { Column } from "./Column";

export function BinaryColumn(option?: IBinaryColumnOption): PropertyDecorator;
export function BinaryColumn(optionOrType?: GenericType<ArrayBufferView> | IBinaryColumnOption, name?: string, defaultValue?: () => ArrayBufferView): PropertyDecorator {
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
    return Column<any, ArrayBufferView>(BinaryColumnMetaData, option);
}
