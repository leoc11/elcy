import "reflect-metadata";
import { Column } from "./Column";
import { GenericType } from "../../Common/Type";
import { ISerializeColumnOption } from "../Option/ISerializateColumnOption";
import { SerializeColumnMetaData } from "../../MetaData/SerializeColumnMetaData";

export function SerializeColumn<T>(option?: ISerializeColumnOption<T>): PropertyDecorator;
export function SerializeColumn<T>(optionOrType?: GenericType<T> | ISerializeColumnOption<T>, name?: string, defaultValue?: () => T): PropertyDecorator {
    let option: ISerializeColumnOption<T>;
    if (optionOrType && typeof optionOrType !== "function") {
        option = optionOrType;
    }
    else {
        option = {};
        if (typeof optionOrType !== "undefined")
            option.type = optionOrType as GenericType<T>;
        if (typeof name !== "undefined")
            option.columnName = name;
        if (typeof defaultValue !== "undefined")
            option.default = defaultValue;
    }
    return Column<any, T>(SerializeColumnMetaData, option);
}
