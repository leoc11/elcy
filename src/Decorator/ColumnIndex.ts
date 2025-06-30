import { IObjectType, PropertySelector, StringKeyOf } from "../Common/Type";
import { Enumerable } from "../Enumerable/Enumerable.internal";
import { FunctionHelper } from "../Helper/FunctionHelper";
import { arrayDelete } from "../Helper/Util";
import { AbstractEntityMetaData } from "../MetaData/AbstractEntityMetaData";
import { ComputedColumnMetaData } from "../MetaData/ComputedColumnMetaData";
import { IndexMetaData } from "../MetaData/IndexMetaData";
import { getEntityMetadata, setEntityMetadata } from "../MetaData/MetaDataMapper";
import { IIndexOption } from "./Option/IIndexOption";

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

        const keyStrings = option.keys.map((o) => typeof o === "string" ? o : FunctionHelper.propertyName(o));
        const includeStrings = !option.includes ? null : option.includes.map((o) => typeof o === "string" ? o : FunctionHelper.propertyName(o));
        const entConstructor = propertyKey ? target.constructor as IObjectType<TE> : target as IObjectType<TE>;
        if (!option.name) {
            option.name = `IX_${(unique ? "UQ_" : "")}${keyStrings.join("_")}${(includeStrings ? "_" + includeStrings.join("_") : "")}`;
        }

        if (option.keys.length <= 0) {
            throw new Error(`"${option.name}" must have at least 1 properties to index`);
        }

        let entityMetaData = getEntityMetadata(entConstructor);
        if (entityMetaData == null) {
            entityMetaData = new AbstractEntityMetaData(entConstructor);
        }
        let indexMetaData = entityMetaData.indices.first((o) => o.name === option.name);
        if (indexMetaData) {
            arrayDelete(entityMetaData.indices, indexMetaData);
        }
        const map = Enumerable.from(entityMetaData.columns).toMap(o => o.propertyName);
        const keys = keyStrings.map(o => map.get(o));
        const includes = !option.includes ? null : includeStrings.map(o => map.get(o));
        indexMetaData = new IndexMetaData(entityMetaData, option.name, keys, includes, option.unique);
        entityMetaData.indices.push(indexMetaData);

        let allColumns = Enumerable.from(keys);
        if (includes) {
            allColumns = allColumns.union(includes);
        }

        const computedColumn = allColumns
            .where(o => o instanceof ComputedColumnMetaData && !o.columnName)
            .first();
        if (computedColumn) {
            throw new Error(`"${computedColumn.propertyName}" cannot be indexed because it's a computed properties`);
        }

        setEntityMetadata(entConstructor, entityMetaData);
    };
}
