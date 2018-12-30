import "reflect-metadata";
import { Column } from "./Column";
import { GenericType } from "../../Common/Type";
import { IDataSerializationColumnOption } from "../Option/IDataSerializationColumnOption";
import { DataSerializationColumnMetaData } from "../../MetaData/DataSerializationColumnMetaData";

export function DataSerializationColumn<T>(option?: IDataSerializationColumnOption<T>): PropertyDecorator;
export function DataSerializationColumn<T>(optionOrType?: GenericType<T> | IDataSerializationColumnOption<T>, name?: string, defaultValue?: () => T): PropertyDecorator {
    let option: IDataSerializationColumnOption<T>;
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
    return Column<any, T>(DataSerializationColumnMetaData, option);
}
