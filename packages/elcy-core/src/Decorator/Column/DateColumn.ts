import { DateColumnType } from "../../Common/ColumnType";
import { DateColumnMetaData } from "../../MetaData/DateColumnMetaData";
import { IDateColumnOption } from "../Option/IDateColumnOption";
import { ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";
import { DateValueType } from "src/Common/Type";

export function DateColumn<TE extends object, T extends DateValueType>(option?: IDateColumnOption<T>): ClassPropertyDecorator<TE, DateValueType>;
export function DateColumn<TE extends object, T extends DateValueType>(name: string, dbtype?: DateColumnType, defaultValue?: () => T): ClassPropertyDecorator<TE, DateValueType>;
export function DateColumn<TE extends object, T extends DateValueType>(optionOrName?: IDateColumnOption<T> | string, dbtype?: DateColumnType, defaultValue?: () => T): ClassPropertyDecorator<TE, DateValueType> {
    let option: IDateColumnOption<T> = {};
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

    return Column<TE, DateValueType>(option.type ?? Date, DateColumnMetaData, option);
}
