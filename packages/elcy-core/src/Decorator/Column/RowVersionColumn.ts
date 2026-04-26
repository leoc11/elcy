import { RowVersionColumnMetaData } from "../../MetaData/RowVersionColumnMetaData";
import { IRowVersionColumnOption } from "../Option/IRowVersionColumnOption";
import { Column } from "./Column";
import { ClassAccessor, ClassPropertyDecorator } from "../Type";
import { IEntityMetaData } from "src/MetaData/Interface/IEntityMetaData";

export function RowVersionColumn<TE extends object>(option?: IRowVersionColumnOption): ClassPropertyDecorator<TE, bigint | Uint8Array>;
export function RowVersionColumn<TE extends object>(name?: string): ClassPropertyDecorator<TE, bigint | Uint8Array>;
export function RowVersionColumn<TE extends object>(optionOrName?: IRowVersionColumnOption | string): ClassPropertyDecorator<TE, bigint | Uint8Array> {
    let option: IRowVersionColumnOption = {};
    if (optionOrName && typeof optionOrName !== "string") {
        option = optionOrName;
    }
    else {
        if (typeof optionOrName !== "undefined") {
            option.columnName = optionOrName as string;
        }
    }

    if (option.columnType === "xmin") {
        option.columnName = "xmin";
        option.isSystemColumn = true;
    }

    option.isReadOnly = true;
    const columnDecorator = Column<TE, number | Uint8Array>(Uint8Array, RowVersionColumnMetaData, option);
    return (target: undefined | ClassAccessor<bigint | Uint8Array>, context: ClassFieldDecoratorContext<TE, bigint | Uint8Array> | ClassAccessorDecoratorContext<TE, bigint | Uint8Array>) => {
        let columnHandlers = context.metadata.columns as Array<(entityMeta: IEntityMetaData<TE>) => void>;
        if (!Array.isArray(columnHandlers)) {
            context.metadata.columns = columnHandlers = [];
        }
        columnDecorator(target as any, context as any);
        columnHandlers.push((entityMeta) => {
            const column = entityMeta.columns.find(o => o.propertyName === context.name) as RowVersionColumnMetaData<TE>;
            if (column === null) {
                throw new Error(`column not found`);
            }
            entityMeta.versionColumn = column;
            if (!entityMeta.concurrencyMode) {
                entityMeta.concurrencyMode = "OPTIMISTIC VERSION";
            }
        });
    };
}
