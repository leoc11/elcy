import { Uuid } from "../../Data/Uuid";
import { IdentifierColumnMetaData } from "../../MetaData/IdentifierColumnMetaData";
import { IIdentityColumnOption } from "../Option/IIdentityColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function IdentifierColumn<TE extends object>(option?: IIdentityColumnOption): ClassPropertyDecorator<TE, string | Uuid>;
export function IdentifierColumn<TE extends object>(name: string, defaultValue?: () => Uuid): ClassPropertyDecorator<TE, string | Uuid>;
export function IdentifierColumn<TE extends object>(optionOrName?: string | IIdentityColumnOption, defaultValue?: () => Uuid): ClassPropertyDecorator<TE, string | Uuid> {
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
    return Column<TE, string | Uuid>(option?.type ?? Uuid, IdentifierColumnMetaData, option);
}
