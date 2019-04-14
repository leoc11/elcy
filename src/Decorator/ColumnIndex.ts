import "reflect-metadata";
import { GenericType, PropertySelector } from "../Common/Type";
import { FunctionHelper } from "../Helper/FunctionHelper";
import { IEntityMetaData } from "../MetaData/Interface/IEntityMetaData";
import { entityMetaKey, columnMetaKey } from "./DecoratorKey";
import { IIndexOption } from "./Option/IIndexOption";
import { IColumnMetaData } from "../MetaData/Interface/IColumnMetaData";
import { AbstractEntityMetaData } from "../MetaData/AbstractEntityMetaData";
import { IndexMetaData } from "../MetaData/IndexMetaData";
import { ComputedColumnMetaData } from "../MetaData/ComputedColumnMetaData";

export function ColumnIndex<TE>(option?: IIndexOption<TE>): (target: object, propertyKey?: string | symbol) => void;
export function ColumnIndex<TE>(name: string, unique?: boolean): (target: object, propertyKey?: string | symbol) => void;
export function ColumnIndex<TE>(name: string, columns: Array<PropertySelector<TE>>, unique?: boolean): (target: object, propertyKey?: string | symbol) => void;
export function ColumnIndex<TE>(columns: Array<PropertySelector<TE>>, unique?: boolean): (target: object, propertyKey?: string | symbol) => void;
export function ColumnIndex<TE>(optionOrNameOrColumns: IIndexOption<TE> | string | Array<PropertySelector<TE>>, uniqueOrColumns?: boolean | Array<PropertySelector<TE>>, unique?: boolean): (target: object, propertyKey?: string | symbol) => void {
    let option: IIndexOption<TE> = {};
    if (typeof optionOrNameOrColumns === "object" && !Array.isArray(optionOrNameOrColumns))
        option = optionOrNameOrColumns;
    else {
        option.name = typeof optionOrNameOrColumns === "string" ? optionOrNameOrColumns : "";
        option.unique = typeof uniqueOrColumns === "boolean" ? uniqueOrColumns : unique || false;
        option.properties = (Array.isArray(optionOrNameOrColumns) ? optionOrNameOrColumns : uniqueOrColumns && Array.isArray(uniqueOrColumns) ? uniqueOrColumns : []);
    }

    return (target: GenericType<TE> | object, propertyKey?: keyof TE) => {
        if (propertyKey)
            option.properties = [propertyKey];
        else {
            option.properties = option.properties
                .select(o => typeof o === "string" ? o : FunctionHelper.propertyName(o))
                .toArray();
        }

        if (!option.name)
            option.name = "IX_" + (unique ? "UQ_" : "") + (option.properties ? option.properties.join("_") : (target as GenericType<TE>).name);

        const entConstructor = propertyKey ? target.constructor : target;
        let entityMetaData: IEntityMetaData<any> = Reflect.getOwnMetadata(entityMetaKey, entConstructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(target.constructor as any);
        }
        let indexMetaData = entityMetaData.indices.first(o => o.name === option.name);
        if (indexMetaData) {
            entityMetaData.indices.delete(indexMetaData);
        }
        indexMetaData = new IndexMetaData(entityMetaData, option.name);
        entityMetaData.indices.push(indexMetaData);

        indexMetaData.apply(option as any);
        if (option.properties) {
            indexMetaData.columns = option.properties
                .select(o => Reflect.getOwnMetadata(columnMetaKey, entityMetaData.type, o as keyof TE) as IColumnMetaData)
                .toArray();

            const computedCol = indexMetaData.columns.first(o => o instanceof ComputedColumnMetaData && !o.columnName);
            if (computedCol) {
                throw new Error(`"${computedCol.propertyName}" cannot be indexed because it's a computed properties`);
            }
        }
        if (!indexMetaData.columns.any()) {
            throw new Error(`"${indexMetaData.name}" must have at least 1 properties to index`);
        }
        Reflect.defineMetadata(entityMetaKey, entityMetaData, entConstructor);
    };
}
