import "reflect-metadata";
import { ColumnMetaData } from "../../MetaData";
import { columnMetaKey } from "../DecoratorKey";

export function ColumnDescription(description: string): PropertyDecorator {
    return (target: object, propertyKey: string) => {
        let columnMetaData: ColumnMetaData<any> = Reflect.getOwnMetadata(columnMetaKey, target.constructor, propertyKey);
        if (columnMetaData == null) {
            columnMetaData = new ColumnMetaData();
        }
        columnMetaData.description = description;
        Reflect.defineMetadata(columnMetaKey, columnMetaData, target.constructor, propertyKey);
    };
}
