import "reflect-metadata";
import { DateColumnType } from "../../Common/ColumnType";
import { DateColumnMetaData } from "../../MetaData/DateColumnMetaData";
import { IDateColumnOption } from "../Option/IDateColumnOption";
import { Column } from "./Column";

export function DateColumn(option?: IDateColumnOption): PropertyDecorator & MethodDecorator;
export function DateColumn(name: string, dbtype?: DateColumnType, defaultValue?: () => Date): PropertyDecorator & MethodDecorator;
export function DateColumn(optionOrName?: IDateColumnOption | string, dbtype?: DateColumnType, defaultValue?: () => Date): PropertyDecorator & MethodDecorator {
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

    return Column<any, any, Date>(DateColumnMetaData, option);
}
