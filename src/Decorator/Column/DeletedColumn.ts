import { BooleanColumnMetaData } from "../../MetaData/BooleanColumnMetaData";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
import { Column } from "./Column";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";

// TODO: casecade soft delete.
export function DeletedColumn<TE extends object = object, T extends boolean = boolean>(option: IBooleanColumnOption): ClassPropertyDecorator<TE, T>;
export function DeletedColumn<TE extends object = object, T extends boolean = boolean>(name?: string): ClassPropertyDecorator<TE, T>;
export function DeletedColumn<TE extends object = object, T extends boolean = boolean>(optionOrName?: IBooleanColumnOption | string): ClassPropertyDecorator<TE, T> {
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
    
    const columnDecorator = Column<TE, T>(BooleanColumnMetaData as any, option);
    return (value: unknown | ClassAccessor<T>, context: ClassFieldDecoratorContext<TE, T> | ClassAccessorDecoratorContext<TE, T>) => {
        columnDecorator(value as any, context as any);
        context.metadata.deletedColumn = context.name;
    };
}
