import { IObjectType, PropertySelector, StringKeyOf } from "../Common/Type";
import { Enumerable } from "@elcy/enumerable";
import { FunctionHelper } from "../Helper/FunctionHelper";
import { AbstractEntityMetaData } from "../MetaData/AbstractEntityMetaData";
import { ComputedColumnMetaData } from "../MetaData/ComputedColumnMetaData";
import { IndexMetaData } from "../MetaData/IndexMetaData";
import { getEntityMetadata, setEntityMetadata } from "../MetaData/MetaDataMapper";
import { IIndexOption } from "./Option/IIndexOption";
import { ArrayExtension } from "src/Extensions/ArrayExtension";

export function ColumnIndex<TE extends object = object>(option?: IIndexOption<TE>): ClassDecorator & PropertyDecorator & MethodDecorator;
export function ColumnIndex<TE extends object = object>(name: string, unique?: boolean): ClassDecorator & PropertyDecorator & MethodDecorator;
export function ColumnIndex<TE extends object = object>(name: string, columns: Array<PropertySelector<TE>>, includes?: Array<PropertySelector<TE>>, unique?: boolean): ClassDecorator & PropertyDecorator & MethodDecorator;
export function ColumnIndex<TE extends object = object>(columns: Array<PropertySelector<TE>>, includes?: Array<PropertySelector<TE>>, unique?: boolean): ClassDecorator & PropertyDecorator & MethodDecorator;
export function ColumnIndex<TE extends object = object>(optionOrNameOrColumns: IIndexOption<TE> | string | Array<PropertySelector<TE>>, uniqueOrColumnsOrIncludes?: boolean | Array<PropertySelector<TE>>, uniqueOrIncludes?: boolean | Array<PropertySelector<TE>>, unique?: boolean): ClassDecorator & PropertyDecorator & MethodDecorator {
    let option: IIndexOption<TE> = {};
    if (Array.isArray(optionOrNameOrColumns)) {
        option.keys = optionOrNameOrColumns;
        if (Array.isArray(uniqueOrColumnsOrIncludes)) {
            option.includes = uniqueOrColumnsOrIncludes;
        }
        option.unique = typeof uniqueOrIncludes === "boolean" ? uniqueOrIncludes : unique || false;
    }
    else if (typeof optionOrNameOrColumns === "object") {
        option = optionOrNameOrColumns;
    }
    else if (typeof optionOrNameOrColumns === "string") {
        option.name = optionOrNameOrColumns;
        if (Array.isArray(uniqueOrColumnsOrIncludes)) {
            option.keys = uniqueOrColumnsOrIncludes;
            if (Array.isArray(uniqueOrIncludes)) {
                option.includes = uniqueOrIncludes;
                option.unique = unique || false;
            }
            else {
                option.unique = uniqueOrIncludes || false;
            }
        }
        else {
            option.unique = uniqueOrColumnsOrIncludes || false;
        }
    }

    return <T, TC extends Function = IObjectType<TE>>(target: TC | object, propertyKey?: StringKeyOf<TE>, descriptor?: TypedPropertyDescriptor<T>) => {
        if (propertyKey) {
            option.keys = [propertyKey];
        }

        if (option.keys.length <= 0) {
            throw new Error(`"${option.name}" must have at least 1 properties to index`);
        }

        const entConstructor = propertyKey ? target.constructor as IObjectType<TE> : target as IObjectType<TE>;
        let entityMeta = getEntityMetadata(entConstructor);
        if (entityMeta == null) {
            entityMeta = new AbstractEntityMetaData(entConstructor);
        }
        const keyMetas = option.keys.map(o => FunctionHelper.columnMeta(entityMeta, o));
        const includeMetas = option.includes?.map((o) => FunctionHelper.columnMeta(entityMeta, o));
        if (!option.name) {
            option.name = `IX_${(unique ? "UQ_" : "")}${keyMetas.map(o => o.propertyName).join("_")}${(includeMetas ? "_" + includeMetas.map(o => o.propertyName).join("_") : "")}`;
        }

        let indexMetaData = entityMeta.indices.find((o) => o.name === option.name);
        if (indexMetaData) {
            ArrayExtension.delete(entityMeta.indices, indexMetaData);
        }
        indexMetaData = new IndexMetaData(entityMeta, option.name, keyMetas, includeMetas, option.unique);
        entityMeta.indices.push(indexMetaData);

        let allColumns = Enumerable.from(keyMetas);
        if (includeMetas) {
            allColumns = allColumns.concat(includeMetas);
        }

        const computedColumn = allColumns
            .filter(o => o instanceof ComputedColumnMetaData && !o.columnName)
            .find();
        if (computedColumn) {
            throw new Error(`"${computedColumn.propertyName}" cannot be indexed because it's a computed properties`);
        }

        setEntityMetadata(entConstructor, entityMeta);
    };
}
