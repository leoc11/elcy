import { StringKeyOf } from "../../Common/Type";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { getColumnMetadata, setColumnMetadata } from "../../MetaData/MetaDataMapper";

export function NullableColumn(): PropertyDecorator & MethodDecorator {
    return <TE extends object = object>(target: TE, propertyKey: StringKeyOf<TE>, descriptor?: PropertyDescriptor) => {
        let columnMetaData = getColumnMetadata(target, propertyKey);
        if (columnMetaData == null) {
            columnMetaData = new ColumnMetaData<TE, any>();
        }
        columnMetaData.nullable = true;
        setColumnMetadata(target, propertyKey, columnMetaData);

        return descriptor;
    };
}
