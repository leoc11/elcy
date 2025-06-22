import { GenericType } from "../../Common/Type";
import { SerializeColumnMetaData } from "../../MetaData/SerializeColumnMetaData";
import { ISerializeColumnOption } from "../Option/ISerializateColumnOption";
import { Column } from "./Column";

export function SerializeColumn<T>(option?: ISerializeColumnOption<T>): PropertyDecorator & MethodDecorator;
export function SerializeColumn<T>(optionOrType?: GenericType<T> | ISerializeColumnOption<T>, name?: string, defaultValue?: () => T): PropertyDecorator & MethodDecorator {
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
    return Column<any, any, T>(SerializeColumnMetaData, option);
}
