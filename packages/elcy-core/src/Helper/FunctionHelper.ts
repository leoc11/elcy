import { IColumnMetaData, IEntityMetaData } from "src/MetaData";
import { PropertySelector, StringKeyOf } from "../Common/Type";

// tslint:disable-next-line:no-namespace
export const FunctionHelper = {
    propertyName<T>(propertySelector: (item: T) => unknown): StringKeyOf<T> {
        const ptopstr = propertySelector.toString();
        return ptopstr.substring(ptopstr.lastIndexOf(".") + 1) as StringKeyOf<T>;
    },
    columnMeta<TE extends object>(entityMeta: IEntityMetaData<TE>, selector: PropertySelector<TE>): IColumnMetaData<TE> {
        if (typeof selector === "string") {
            return entityMeta.properties[selector];
        }

        return selector(entityMeta.properties as TE) as IColumnMetaData<TE>;
    }
};
