import { Uuid } from "../../Data/Uuid";
import { IdentifierColumnMetaData } from "../../MetaData/IdentifierColumnMetaData";
import { IIdentityColumnOption } from "../Option/IIdentityColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function IdentifierColumn<TE extends object, T extends Uuid>(option?: IIdentityColumnOption): ClassPropertyDecorator<TE, T>;
export function IdentifierColumn<TE extends object, T extends Uuid>(name: string, defaultValue?: () => Uuid): ClassPropertyDecorator<TE, T>;
export function IdentifierColumn<TE extends object, T extends Uuid>(optionOrName?: string | IIdentityColumnOption, defaultValue?: () => Uuid): ClassPropertyDecorator<TE, T> {
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
    return Column<TE, T>(IdentifierColumnMetaData as any, option);
}
