import "reflect-metadata";
import { GenericType } from "../Common/Type";
import { FunctionHelper } from "../Helper/FunctionHelper";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { entityMetaKey, columnMetaKey } from "./DecoratorKey";
import { IIndexOption } from "./Option/IIndexOption";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { AbstractEntityMetaData } from "../MetaData/AbstractEntityMetaData";
import { IndexMetaData } from "../MetaData/IndexMetaData";

export function ColumnIndex(option?: IIndexOption): (target: object, propertyKey?: string | symbol) => void;
export function ColumnIndex(name: string, unique?: boolean): (target: object, propertyKey?: string | symbol) => void;
export function ColumnIndex<T>(name: string, columns: Array<string | ((item: T) => any)>, unique?: boolean): (target: object, propertyKey?: string | symbol) => void;
export function ColumnIndex<T>(columns: Array<string | ((item: T) => any)>, unique?: boolean): (target: object, propertyKey?: string | symbol) => void;
export function ColumnIndex<T>(optionOrNameOrColumns: IIndexOption | string | Array<string | ((item: T) => any)>, uniqueOrColumns?: boolean | Array<string | ((item: T) => any)>, unique?: boolean): (target: object, propertyKey?: string | symbol) => void {
    let option: IIndexOption = {};
    if (typeof optionOrNameOrColumns === "object" && !Array.isArray(optionOrNameOrColumns))
        option = optionOrNameOrColumns;
    option.name = typeof optionOrNameOrColumns === "string" ? optionOrNameOrColumns : "";
    option.unique = typeof uniqueOrColumns === "boolean" ? uniqueOrColumns : unique || false;
    option.properties = (Array.isArray(optionOrNameOrColumns) ? optionOrNameOrColumns : uniqueOrColumns && Array.isArray(uniqueOrColumns) ? uniqueOrColumns : []).map((item) => {
        if (typeof item === "string")
            return item;
        return FunctionHelper.propertyName(item);
    });

    return (target: GenericType<T> | object, propertyKey?: string /* | symbol*//*, descriptor: PropertyDescriptor*/) => {
        if (!option.name)
            option.name = "IX_" + (unique ? "UQ_" : "") + (option.properties ? option.properties.join("_") : propertyKey ? propertyKey : (target as GenericType<T>).name);
        if (propertyKey)
            option.properties = [propertyKey];

        const entConstructor = propertyKey ? target.constructor : target;
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, entConstructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as any);
        }
        let indexMetaData = entityMetaData.indices.first(o => o.name === option.name);
        if (indexMetaData) {
            entityMetaData.indices.remove(indexMetaData);
        }
        indexMetaData = new IndexMetaData(entityMetaData, option.name);
        entityMetaData.indices.push(indexMetaData);

        indexMetaData.apply(option as any);
        if (option.properties) {
            indexMetaData.columns = option.properties
                .select(o => Reflect.getOwnMetadata(columnMetaKey, entityMetaData.type, o) as IColumnMetaData)
                .toArray();
        }
        Reflect.defineMetadata(entityMetaKey, entityMetaData, entConstructor);
    };
}
