import { DateTimeColumnType } from "../../Common/ColumnType";
import { ColumnGeneration } from "../../Common/Enum";
import { TimeZoneHandling } from "../../Common/StringType";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { DbFunction } from "../../Query/DbFunction";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";

export function CreatedDateColumn<TE extends object = object, T extends Date = Date>(option?: IDateTimeColumnOption): ClassPropertyDecorator<TE, T>;
export function CreatedDateColumn<TE extends object = object, T extends Date = Date>(name: string, dbtype: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): ClassPropertyDecorator<TE, T>;
export function CreatedDateColumn<TE extends object = object, T extends Date = Date>(optionOrName?: IDateTimeColumnOption | string, dbtype?: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): ClassPropertyDecorator<TE, T> {
    let option: IDateTimeColumnOption = {};
    if (optionOrName) {
        if (typeof optionOrName === "string") {
            option.columnName = optionOrName;
            if (timeZoneHandling !== undefined) {
                option.timeZoneHandling = timeZoneHandling;
            }
            if (dbtype !== undefined) {
                option.columnType = dbtype;
            }
        }
        else {
            option = optionOrName;
        }
    }

    /* istanbul ignore next */
    option.default = option.timeZoneHandling === "none" ? () => DbFunction.timestamp() : () => DbFunction.utcTimestamp();
    option.isReadOnly = true;
    option.generation = ColumnGeneration.Insert;
    const columnDecorator = Column<TE, T>(DateTimeColumnMetaData as any, option);
    return (target: undefined | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T> | ClassAccessorDecoratorContext<TE, T>) => {
        columnDecorator(target as any, context as any);
        context.metadata.createdDateColumn = context.name;
    };
}
