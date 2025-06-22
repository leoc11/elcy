import { Uuid } from "../../Data/Uuid";
import { IdentifierColumnMetaData } from "../../MetaData/IdentifierColumnMetaData";
import { IIdentityColumnOption } from "../Option/IIdentityColumnOption";
import { Column } from "./Column";

export function IdentifierColumn(option?: IIdentityColumnOption): MethodDecorator & PropertyDecorator;
export function IdentifierColumn(name: string, defaultValue?: () => Uuid): MethodDecorator & PropertyDecorator;
export function IdentifierColumn(optionOrName?: string | IIdentityColumnOption, defaultValue?: () => Uuid): MethodDecorator & PropertyDecorator {
    let option: IIdentityColumnOption = {};
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
    return Column<any, any, Uuid>(IdentifierColumnMetaData, option);
}
