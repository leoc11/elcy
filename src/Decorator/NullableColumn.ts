import "reflect-metadata";
import { ColumnMetaData } from "../MetaData";
import { columnMetaKey } from "./DecoratorKey";

export function NullableColumn(): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    return (target: object, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
        let columnMetaData: ColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, target, propertyKey);
        if (columnMetaData == null) {
            columnMetaData = new ColumnMetaData<any>();
        }
        columnMetaData.nullable = true;
        Reflect.defineMetadata(columnMetaKey, columnMetaData, target, propertyKey);
    };
}