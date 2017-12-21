import "reflect-metadata";
import { ColumnMetaData } from "../MetaData/ColumnMetaData/index";
import { columnMetaKey } from "./DecoratorKey";

export function IndexColumn(): (target: object, propertyKey: string | symbol, descriptor: PropertyDescriptor) => void {
    return (target: object, propertyKey: string /* | symbol*/, descriptor: PropertyDescriptor) => {
        let columnMetaData: ColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, target, propertyKey);
        if (columnMetaData == null) {
            columnMetaData = new ColumnMetaData();
        }
        columnMetaData.indexed = true;
        Reflect.defineMetadata(columnMetaKey, columnMetaData, target, propertyKey);
    };
}
