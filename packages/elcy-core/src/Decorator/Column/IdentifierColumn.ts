import { Uuid } from "../../Data/Uuid";
import { IdentifierColumnMetaData } from "../../MetaData/IdentifierColumnMetaData";
import { IIdentityColumnOption } from "../Option/IIdentityColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function IdentifierColumn<TE extends object, T extends string | Uuid>(option?: IIdentityColumnOption<T>): ClassPropertyDecorator<TE, string | Uuid>;
export function IdentifierColumn<TE extends object, T extends string | Uuid>(name: string, defaultValue?: () => T): ClassPropertyDecorator<TE, string | Uuid>;
export function IdentifierColumn<TE extends object, T extends string | Uuid>(optionOrName?: string | IIdentityColumnOption<T>, defaultValue?: () => T): ClassPropertyDecorator<TE, string | Uuid> {
    let option: IIdentityColumnOption<T> = {};
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
