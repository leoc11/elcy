import "reflect-metadata";
import { GenericType } from "../Common/Type";
import { FunctionHelper } from "../Helper/FunctionHelper";
import { AbstractEntityMetaData, IndexMetaData } from "../MetaData";
import { IEntityMetaData } from "../MetaData/Interface";
import { entityMetaKey } from "./DecoratorKey";
import { IIndexOption } from "./Option/IIndexOption";

export function ColumnIndex(option: IIndexOption): (target: object, propertyKey?: string | symbol) => void;
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

        const entConstructor = propertyKey ? target.constructor : target;
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, entConstructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as any);
        }
        let indexMetaData = entityMetaData.indices[option.name];
        if (indexMetaData == null) {
            indexMetaData = new IndexMetaData(option.name);
            entityMetaData.indices[option.name] = indexMetaData;
        }
        if (propertyKey)
            option.properties = [propertyKey];
        indexMetaData.Apply(option);
        Reflect.defineMetadata(entityMetaKey, entityMetaData, entConstructor);
    };
}
