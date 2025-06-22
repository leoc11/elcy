import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { IRowVersionColumnOption } from "../Option/IRowVersionColumnOption";
import { Column } from "./Column";
import { StringKeyOf } from "../../Common/Type";
import { getColumnMetadata, getEntityMetadata } from "../../MetaData/MetaDataMapper";

export function RowVersionColumn(option?: IRowVersionColumnOption): PropertyDecorator & MethodDecorator;
export function RowVersionColumn(optionOrName?: IRowVersionColumnOption | string, defaultValue?: () => string): PropertyDecorator & MethodDecorator {
    let option: IRowVersionColumnOption = {};
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
    
    const columnDecorator = Column<any, any, Uint8Array>(RowVersionColumnMetaData, option);
    return <TE extends object>(target: TE, propertyKey: StringKeyOf<TE>, descriptor?: TypedPropertyDescriptor<Uint8Array>) => {
        let descriptorResult = columnDecorator(target, propertyKey, descriptor);
        const metadata = getColumnMetadata<TE, any, Uint8Array>(target, propertyKey) as RowVersionColumnMetaData<TE>;
        const entityMetaData = getEntityMetadata(target);
        entityMetaData.versionColumn = metadata;
        if (!entityMetaData.concurrencyMode) {
            entityMetaData.concurrencyMode = "OPTIMISTIC VERSION";
        }

        return descriptorResult;
    };
}
