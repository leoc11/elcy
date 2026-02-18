import { DateColumnType } from "../../Common/ColumnType";
import { DateColumnMetaData } from "../../MetaData/DateColumnMetaData";
import { IDateColumnOption } from "../Option/IDateColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function DateColumn<TE extends object, T extends Date>(option?: IDateColumnOption): ClassPropertyDecorator<TE, T>;
export function DateColumn<TE extends object, T extends Date>(name: string, dbtype?: DateColumnType, defaultValue?: () => Date): ClassPropertyDecorator<TE, T>;
export function DateColumn<TE extends object, T extends Date>(optionOrName?: IDateColumnOption | string, dbtype?: DateColumnType, defaultValue?: () => Date): ClassPropertyDecorator<TE, T> {
    let option: IDateColumnOption = {};
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
        if (defaultValue !== undefined) {
            option.default = defaultValue;
        }
        if (dbtype !== undefined) {
            option.columnType = dbtype;
        }
    }
    else if (optionOrName) {
        option = optionOrName;
    }

    return Column<TE, T>(DateColumnMetaData as any, option);
}
