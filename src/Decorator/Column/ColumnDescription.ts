import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { getColumnMetadata, setColumnMetadata } from "../../MetaData/MetaDataMapper";
import { IObjectType, StringKeyOf } from "../../Common/Type";

export function ColumnDescription<TE extends object = object>(description: string): PropertyDecorator & MethodDecorator {
    return <T>(target: TE, propertyKey: StringKeyOf<TE>, descriptor?: TypedPropertyDescriptor<T>) => {
        let columnMetaData = getColumnMetadata(target.constructor as IObjectType<TE>, propertyKey);
        if (columnMetaData == null) {
            columnMetaData = new ColumnMetaData();
        }
        columnMetaData.description = description;
        setColumnMetadata(target.constructor as IObjectType<TE>, propertyKey, columnMetaData);

        return descriptor;
    };
}
