import "reflect-metadata";
import { BooleanColumnMetaData } from "../../MetaData/BooleanColumnMetaData";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
import { Column } from "./Column";
import { StringKeyOf } from "../../Common/Type";
import { getColumnMetadata, getEntityMetadata } from "../../MetaData/MetaDataMapper";

// TODO: casecade soft delete.
export function DeletedColumn<TE extends object = object>(option: IBooleanColumnOption): PropertyDecorator & MethodDecorator;
export function DeletedColumn<TE extends object = object>(name?: string): PropertyDecorator & MethodDecorator;
export function DeletedColumn<TE extends object = object>(optionOrName?: IBooleanColumnOption | string): PropertyDecorator & MethodDecorator {
    let option: IBooleanColumnOption = {};
    if (typeof optionOrName === "string") {
        option.columnName = optionOrName;
    }
    else if (optionOrName) {
        option = optionOrName;
    }

    /* istanbul ignore next */
    option.default = () => false;
    option.isReadOnly = true;
    
    const columnDecorator = Column<any, any, boolean>(BooleanColumnMetaData, option);
    return <T = boolean>(target: TE, propertyKey: StringKeyOf<TE>, descriptor?: TypedPropertyDescriptor<T>) => {
        let descriptorResult = columnDecorator(target, propertyKey, descriptor);
        const metadata = getColumnMetadata<TE, any, boolean>(target, propertyKey) as BooleanColumnMetaData<TE>;
        const entityMetaData = getEntityMetadata(target);
        entityMetaData.deletedColumn = metadata;

        return descriptorResult;
    };
}
