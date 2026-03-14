import type { Temporal } from "@js-temporal/polyfill";
import { DateTimeColumnType } from "../../Common/ColumnType";
import { ColumnGeneration } from "../../Common/Enum";
import { TimeZoneHandling } from "../../Common/StringType";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { DbFunction } from "../../Query/DbFunction";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";

export function ModifiedDateColumn<TE extends object>(option?: IDateTimeColumnOption): ClassPropertyDecorator<TE, Date | Temporal.Instant>;
export function ModifiedDateColumn<TE extends object>(name: string, dbtype: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): ClassPropertyDecorator<TE, Date | Temporal.Instant>;
export function ModifiedDateColumn<TE extends object>(optionOrName?: IDateTimeColumnOption | string, dbtype?: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): ClassPropertyDecorator<TE, Date | Temporal.Instant> {
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
    option.generation = ColumnGeneration.Insert | ColumnGeneration.Update;

    const columnDecorator = Column<TE, Date | Temporal.Instant>(option.type ?? Date, DateTimeColumnMetaData, option);
    return (target: undefined | ClassAccessor<Date | Temporal.Instant>, context: ClassFieldDecoratorContext<TE, Date | Temporal.Instant> | ClassAccessorDecoratorContext<TE, Date | Temporal.Instant>) => {
        let columnHandlers = context.metadata.columns as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(columnHandlers)) {
            context.metadata.columns = columnHandlers = [];
        }
        columnDecorator(target as any, context as any);
        columnHandlers.push((entityMeta) => {
            const dateColumn = entityMeta.columns.find(o => o.propertyName === context.name) as DateTimeColumnMetaData<TE>;
            if (dateColumn === null) {
                throw new Error(`column not found`);
            }
            entityMeta.modifiedDateColumn = dateColumn;
        });
    };
}
