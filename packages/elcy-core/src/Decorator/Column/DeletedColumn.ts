import { BooleanColumnMetaData } from "../../MetaData/BooleanColumnMetaData";
import { IBooleanColumnOption } from "../Option/IBooleanColumnOption";
import { Column } from "./Column";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";

// TODO: casecade soft delete.
export function DeletedColumn<TE extends object = object>(option: IBooleanColumnOption): ClassPropertyDecorator<TE, boolean>;
export function DeletedColumn<TE extends object = object>(name?: string): ClassPropertyDecorator<TE, boolean>;
export function DeletedColumn<TE extends object = object>(optionOrName?: IBooleanColumnOption | string): ClassPropertyDecorator<TE, boolean> {
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

    const columnDecorator = Column<TE, boolean>(Boolean, BooleanColumnMetaData, option);
    return (value: unknown | ClassAccessor<boolean>, context: ClassFieldDecoratorContext<TE, boolean> | ClassAccessorDecoratorContext<TE, boolean>) => {
        let columnHandlers = context.metadata.columns as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(columnHandlers)) {
            context.metadata.columns = columnHandlers = [];
        }
        
        columnDecorator(value as any, context as any);
        context.metadata.deletedColumn = context.name;
        columnHandlers.push((entityMeta) => {
            const column = entityMeta.properties[context.name as keyof TE] as BooleanColumnMetaData<TE>;
            if (column === null) {
                throw new Error(`column not found`);
            }

            entityMeta.deletedColumn = column;
        });
    };
}
