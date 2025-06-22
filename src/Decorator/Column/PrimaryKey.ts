import { IObjectType, StringKeyOf } from "../../Common/Type";
import { AbstractEntityMetaData } from "../../MetaData/AbstractEntityMetaData";
import { ColumnMetaData } from "../../MetaData/ColumnMetaData";
import { getColumnMetadata, getEntityMetadata, setEntityMetadata } from "../../MetaData/MetaDataMapper";

export function PrimaryKey<TE extends object>(): MethodDecorator & PropertyDecorator {
    return <T>(target: TE, propertyKey: StringKeyOf<TE>, descriptor?: TypedPropertyDescriptor<T>) => {
        let entityMetaData = getEntityMetadata(target.constructor as IObjectType<TE>);
        if (!entityMetaData) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as IObjectType<TE>);
            setEntityMetadata(target.constructor as IObjectType<TE>, entityMetaData);
        }

        if (!entityMetaData.primaryKeys.some((o) => o.propertyName === propertyKey)) {
            let columnMeta = getColumnMetadata(target.constructor as IObjectType<TE>, propertyKey);
            if (!columnMeta) {
                columnMeta = new ColumnMetaData<TE, any>();
                columnMeta.propertyName = propertyKey;
            }
            entityMetaData.primaryKeys.push(columnMeta);
        }

        return descriptor;
    };
}
