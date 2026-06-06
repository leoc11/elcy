import { DateTimeColumnType } from "../../Common/ColumnType";
import { ColumnGeneration } from "../../Common/Enum";
import { TimeZoneHandling } from "../../Common/StringType";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { DbFunction } from "../../Query/DbFunction";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { Column } from "./Column";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";
import { DateTimeValueType } from "src/Common/Type";

export function CreatedDateColumn<TE extends object, T extends DateTimeValueType>(option?: IDateTimeColumnOption<T>): ClassPropertyDecorator<TE, DateTimeValueType>;
export function CreatedDateColumn<TE extends object, T extends DateTimeValueType>(name: string, dbtype: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): ClassPropertyDecorator<TE, DateTimeValueType>;
export function CreatedDateColumn<TE extends object, T extends DateTimeValueType>(optionOrName?: IDateTimeColumnOption<T> | string, dbtype?: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): ClassPropertyDecorator<TE, DateTimeValueType> {
    let option: IDateTimeColumnOption<T> = {};
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
    option.default = (option.timeZoneHandling === "none" ? () => DbFunction.timestamp() : () => DbFunction.utcTimestamp()) as () => T;
    option.isReadOnly = true;
    option.generation = ColumnGeneration.Insert;
    const columnDecorator = Column<TE, DateTimeValueType>(option.type ?? Date, DateTimeColumnMetaData, option);
    return (target: undefined | ClassAccessor<DateTimeValueType>, context: ClassFieldDecoratorContext<TE, DateTimeValueType> | ClassAccessorDecoratorContext<TE, DateTimeValueType>) => {
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
            entityMeta.createDateColumn = dateColumn;
        });
    };
}
