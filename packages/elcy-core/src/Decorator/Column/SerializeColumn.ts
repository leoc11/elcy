import { GenericType } from "../../Common/Type";
import { SerializeColumnMetaData } from "../../MetaData/SerializeColumnMetaData";
import { ISerializeColumnOption } from "../Option/ISerializateColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function SerializeColumn<TE extends object, T extends object>(option?: ISerializeColumnOption<T>): ClassPropertyDecorator<TE, T>;
export function SerializeColumn<TE extends object, T extends object>(type: GenericType<T>, name?: string, defaultValue?: () => T): ClassPropertyDecorator<TE, T>;
export function SerializeColumn<TE extends object, T extends object>(optionOrType?: GenericType<T> | ISerializeColumnOption<T>, name?: string, defaultValue?: () => T): ClassPropertyDecorator<TE, T> {
    let option: ISerializeColumnOption<T>;
    if (optionOrType && typeof optionOrType !== "function") {
        option = optionOrType;
    }
    else {
        option = {};
        if (typeof optionOrType !== "undefined") {
            option.type = optionOrType as GenericType<T>;
        }
        if (typeof name !== "undefined") {
            option.columnName = name;
        }
        if (typeof defaultValue !== "undefined") {
            option.default = defaultValue;
        }
    }
    if (!option.type) {
        throw new Error("type required");
    }

    return Column<TE, T>(option.type, SerializeColumnMetaData, option);
}
