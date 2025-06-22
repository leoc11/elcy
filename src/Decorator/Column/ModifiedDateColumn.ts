import { DateTimeColumnType } from "../../Common/ColumnType";
import { ColumnGeneration } from "../../Common/Enum";
import { TimeZoneHandling } from "../../Common/StringType";
import { StringKeyOf } from "../../Common/Type";
import { DateTimeColumnMetaData } from "../../MetaData/DateTimeColumnMetaData";
import { getColumnMetadata, getEntityMetadata } from "../../MetaData/MetaDataMapper";
import { IDateTimeColumnOption } from "../Option/IDateTimeColumnOption";
import { Column } from "./Column";

export function ModifiedDateColumn<TE extends object = object>(option?: IDateTimeColumnOption): PropertyDecorator & MethodDecorator;
export function ModifiedDateColumn<TE extends object = object>(name: string, dbtype: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): PropertyDecorator & MethodDecorator;
export function ModifiedDateColumn<TE extends object = object>(optionOrName?: IDateTimeColumnOption | string, dbtype?: DateTimeColumnType, timeZoneHandling?: TimeZoneHandling): PropertyDecorator & MethodDecorator {
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
    option.default = option.timeZoneHandling === "none" ? () => Date.timestamp() : () => Date.utcTimestamp();
    option.isReadOnly = true;
    option.generation = ColumnGeneration.Insert | ColumnGeneration.Update;

    const columnDecorator = Column<any, any, Date>(DateTimeColumnMetaData, option);
    return <T = Date>(target: TE, propertyKey: StringKeyOf<TE>, descriptor?: TypedPropertyDescriptor<T>) => {
        let descriptorResult = columnDecorator(target, propertyKey, descriptor);
        const metadata = getColumnMetadata<TE, any, Date>(target, propertyKey) as DateTimeColumnMetaData<TE>;
        const entityMetaData = getEntityMetadata(target);
        entityMetaData.modifiedDateColumn = metadata;

        return descriptorResult;
    };
}
